using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Referrals.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Referrals.Commands;

public sealed record RedeemReferralCodeCommand(string UserId, RedeemReferralRequest Request)
    : IRequest<ApiResponse<RedeemReferralResultDto>>;

public sealed class RedeemReferralCodeCommandHandler
    : IRequestHandler<RedeemReferralCodeCommand, ApiResponse<RedeemReferralResultDto>>
{
    private readonly IAppDbContext _db;

    public RedeemReferralCodeCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<RedeemReferralResultDto>> Handle(RedeemReferralCodeCommand request, CancellationToken cancellationToken)
    {
        var code = (request.Request.Code ?? string.Empty).Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(code))
        {
            throw new ValidationAppException("Referral code is required.");
        }

        var now = DateTime.UtcNow;
        var invitee = await _db.Users
            .FirstOrDefaultAsync(x => x.Id == request.UserId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("User not found.");

        var existingRedeem = await _db.ReferralRecords
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.RefereeUserId == request.UserId && !x.IsDeleted, cancellationToken);
        if (existingRedeem is not null)
        {
            throw new ValidationAppException("You have already used a referral code.");
        }

        var profile = await _db.ReferralProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.ReferralCode == code && !x.IsDeleted, cancellationToken)
            ?? throw new ValidationAppException("Referral code is invalid.");

        if (string.Equals(profile.UserId, request.UserId, StringComparison.Ordinal))
        {
            throw new ValidationAppException("You cannot redeem your own referral code.");
        }

        var referrer = await _db.Users
            .FirstOrDefaultAsync(x => x.Id == profile.UserId && !x.IsDeleted, cancellationToken)
            ?? throw new ValidationAppException("Referral code owner is unavailable.");

        var setting = await _db.SystemSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => !x.IsDeleted && x.Key == SystemSettingKeys.GrowthReferralProgramConfig,
                cancellationToken);
        var config = ReferralProgramConfigSerializer.ParseOrDefault(setting?.Value);
        if (!config.IsEnabled)
        {
            throw new ValidationAppException("Referral rewards are currently disabled.");
        }

        var successfulReferrals = await _db.ReferralRecords
            .AsNoTracking()
            .CountAsync(x => x.ReferrerUserId == referrer.Id && !x.IsDeleted, cancellationToken);

        var canReceiveBaseReferrerReward = config.MaxSuccessfulReferralsPerUser <= 0
            || successfulReferrals < config.MaxSuccessfulReferralsPerUser;

        var inviterRewardAiCredits = canReceiveBaseReferrerReward ? config.InviterRewardAiCredits : 0;
        var inviterRewardPremiumDays = canReceiveBaseReferrerReward ? Math.Max(0, config.InviterRewardPremiumDays) : 0;
        var inviteeRewardAiCredits = config.InviteeRewardAiCredits;
        var inviteeRewardPremiumDays = Math.Max(0, config.InviteeRewardPremiumDays);

        var referralRecord = new ReferralRecord
        {
            Id = Guid.NewGuid().ToString("N"),
            ReferrerUserId = referrer.Id,
            RefereeUserId = invitee.Id,
            ReferralCode = code,
            RedeemedAt = now,
            InviterRewardAiCredits = inviterRewardAiCredits,
            InviterRewardPremiumDays = inviterRewardPremiumDays,
            InviteeRewardAiCredits = inviteeRewardAiCredits,
            InviteeRewardPremiumDays = inviteeRewardPremiumDays,
            CreatedAt = now,
            UpdatedAt = now,
            IsDeleted = false
        };

        _db.ReferralRecords.Add(referralRecord);

        invitee.ReferredByUserId = referrer.Id;
        invitee.UpdatedAt = now;

        StageCreditReward(referrer.Id, inviterRewardAiCredits, $"referral:inviter:{referralRecord.Id}");
        StageCreditReward(invitee.Id, inviteeRewardAiCredits, $"referral:invitee:{referralRecord.Id}");

        if (inviterRewardPremiumDays > 0)
        {
            await GrantPremiumDaysAsync(
                referrer,
                inviterRewardPremiumDays,
                $"referral-inviter:{referralRecord.Id}",
                now,
                cancellationToken);
        }

        if (inviteeRewardPremiumDays > 0)
        {
            await GrantPremiumDaysAsync(
                invitee,
                inviteeRewardPremiumDays,
                $"referral-invitee:{referralRecord.Id}",
                now,
                cancellationToken);
        }

        var milestoneAwards = await AwardMilestonesAsync(
            referrer,
            successfulReferrals + 1,
            config,
            now,
            cancellationToken);

        var totalInviterAwardAiCredits = inviterRewardAiCredits + milestoneAwards.Sum(x => x.RewardAiCredits);
        var totalInviterAwardPremiumDays = inviterRewardPremiumDays + milestoneAwards.Sum(x => x.RewardPremiumDays);

        var rewardSummary = BuildRewardSummary(totalInviterAwardAiCredits, totalInviterAwardPremiumDays);
        _db.Notifications.Add(new Notification
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = referrer.Id,
            Type = "referral",
            Title = "New referral joined",
            Body = $"{invitee.DisplayName} used your referral code. {rewardSummary}",
            ReferenceType = "referral",
            ReferenceId = referralRecord.Id,
            IsRead = false,
            IsDismissed = false,
            CreatedAt = now,
            UpdatedAt = now,
            IsDeleted = false
        });

        await _db.SaveChangesAsync(cancellationToken);

        var response = new RedeemReferralResultDto(
            referralRecord.Id,
            referrer.Id,
            referrer.DisplayName,
            0,
            inviteeRewardPremiumDays,
            0,
            totalInviterAwardPremiumDays,
            milestoneAwards,
            inviteeRewardAiCredits,
            totalInviterAwardAiCredits);

        return ApiResponse<RedeemReferralResultDto>.Ok(response);
    }

    private async Task<IReadOnlyList<ReferralMilestoneProgressDto>> AwardMilestonesAsync(
        User referrer,
        int currentReferralCount,
        ReferralProgramConfigDto config,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var milestones = (config.Milestones ?? [])
            .Where(x => x.IsActive)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.ReferralsRequired)
            .ToList();

        if (milestones.Count == 0)
        {
            return [];
        }

        var awardedKeys = await _db.ReferralMilestoneRewards
            .AsNoTracking()
            .Where(x => x.ReferrerUserId == referrer.Id && !x.IsDeleted)
            .Select(x => x.MilestoneKey)
            .ToListAsync(cancellationToken);

        var awardedKeySet = awardedKeys.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var awarded = new List<ReferralMilestoneProgressDto>();

        foreach (var milestone in milestones)
        {
            if (currentReferralCount < milestone.ReferralsRequired)
            {
                continue;
            }

            if (awardedKeySet.Contains(milestone.Key))
            {
                continue;
            }

            var reward = new ReferralMilestoneReward
            {
                Id = Guid.NewGuid().ToString("N"),
                ReferrerUserId = referrer.Id,
                MilestoneKey = milestone.Key,
                ReferralsRequired = milestone.ReferralsRequired,
                RewardAiCredits = milestone.RewardAiCredits,
                RewardPremiumDays = Math.Max(0, milestone.RewardPremiumDays),
                AwardedAt = now,
                CreatedAt = now,
                UpdatedAt = now,
                IsDeleted = false
            };

            _db.ReferralMilestoneRewards.Add(reward);
            awardedKeySet.Add(milestone.Key);

            StageCreditReward(referrer.Id, reward.RewardAiCredits,
                $"referral:milestone:{referrer.Id}:{milestone.Key}");

            if (reward.RewardPremiumDays > 0)
            {
                await GrantPremiumDaysAsync(
                    referrer,
                    reward.RewardPremiumDays,
                    $"referral-milestone:{referrer.Id}:{milestone.Key}",
                    now,
                    cancellationToken);
            }

            awarded.Add(new ReferralMilestoneProgressDto(
                milestone.Key,
                milestone.Title,
                milestone.ReferralsRequired,
                currentReferralCount,
                reward.RewardXp,
                reward.RewardPremiumDays,
                milestone.RewardLabel,
                milestone.SortOrder,
                milestone.IsActive,
                true,
                true,
                reward.RewardAiCredits));
        }

        return awarded;
    }

    private void StageCreditReward(string userId, int amount, string reference)
    {
        if (amount <= 0) return;
        // One SaveChanges commits the redemption, milestone, wallet grant and ledger
        // together. The existing wallet service opens its own transaction and clears
        // tracking, so it must not be called in the middle of this unit of work.
        // Unique redemption/milestone/reference indexes prevent a second award.
        _db.AiCreditGrants.Add(new AiCreditGrant
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = userId,
            Reference = reference,
            Source = "referral",
            Amount = amount,
            Remaining = amount
        });
        _db.AiCreditEntries.Add(new AiCreditEntry
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = userId,
            Reference = reference,
            Kind = "referral-reward",
            Amount = amount
        });
    }

    private async Task GrantPremiumDaysAsync(
        User user,
        int days,
        string providerReference,
        DateTime now,
        CancellationToken cancellationToken)
    {
        if (days <= 0)
        {
            return;
        }

        var activeReferralSubscription = await _db.UserSubscriptions
            .FirstOrDefaultAsync(
                x => x.UserId == user.Id
                     && !x.IsDeleted
                     && x.Provider == "referral"
                     && x.Status == "active"
                     && (!x.ExpiresAt.HasValue || x.ExpiresAt > now),
                cancellationToken);

        if (activeReferralSubscription is null)
        {
            _db.UserSubscriptions.Add(new UserSubscription
            {
                Id = Guid.NewGuid().ToString("N"),
                UserId = user.Id,
                PlanId = "referral_reward",
                Provider = "referral",
                ProviderReference = providerReference,
                Status = "active",
                StartedAt = now,
                ExpiresAt = now.AddDays(days),
                AutoRenew = false,
                LastVerifiedAt = now,
                CreatedAt = now,
                UpdatedAt = now,
                IsDeleted = false
            });
        }
        else
        {
            var baseDate = activeReferralSubscription.ExpiresAt.HasValue && activeReferralSubscription.ExpiresAt > now
                ? activeReferralSubscription.ExpiresAt.Value
                : now;

            activeReferralSubscription.ExpiresAt = baseDate.AddDays(days);
            activeReferralSubscription.UpdatedAt = now;
            activeReferralSubscription.LastVerifiedAt = now;
            activeReferralSubscription.ProviderReference = providerReference;
        }

        user.IsPremium = true;
        user.UpdatedAt = now;
    }

    private static string BuildRewardSummary(int awardedAiCredits, int awardedPremiumDays)
    {
        var rewards = new List<string>();
        if (awardedAiCredits > 0)
        {
            rewards.Add($"{awardedAiCredits} AI credits");
        }

        if (awardedPremiumDays > 0)
        {
            rewards.Add($"{awardedPremiumDays} premium day{(awardedPremiumDays == 1 ? string.Empty : "s")}");
        }

        if (rewards.Count == 0)
        {
            return "No rewards were granted because your current referral reward cap has been reached.";
        }

        return $"You earned {string.Join(" and ", rewards)}.";
    }
}
