using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Referrals.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace MemoPal.Application.Features.Referrals.Queries;

public sealed record GetReferralSummaryQuery(string UserId) : IRequest<ApiResponse<ReferralSummaryDto>>;

public sealed class GetReferralSummaryQueryHandler
    : IRequestHandler<GetReferralSummaryQuery, ApiResponse<ReferralSummaryDto>>
{
    private static readonly char[] ReferralCodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".ToCharArray();
    private readonly IAppDbContext _db;

    public GetReferralSummaryQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<ReferralSummaryDto>> Handle(GetReferralSummaryQuery request, CancellationToken cancellationToken)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(x => x.Id == request.UserId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("User not found.");

        var profile = await _db.ReferralProfiles
            .FirstOrDefaultAsync(x => x.UserId == request.UserId && !x.IsDeleted, cancellationToken);

        if (profile is null)
        {
            profile = new ReferralProfile
            {
                Id = Guid.NewGuid().ToString("N"),
                UserId = request.UserId,
                ReferralCode = await GenerateUniqueReferralCodeAsync(cancellationToken),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsDeleted = false
            };
            _db.ReferralProfiles.Add(profile);
            await _db.SaveChangesAsync(cancellationToken);
        }
        else if (string.IsNullOrWhiteSpace(profile.ReferralCode))
        {
            profile.ReferralCode = await GenerateUniqueReferralCodeAsync(cancellationToken);
            profile.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
        }

        var programSetting = await _db.SystemSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => !x.IsDeleted && x.Key == SystemSettingKeys.GrowthReferralProgramConfig,
                cancellationToken);
        var config = ReferralProgramConfigSerializer.ParseOrDefault(programSetting?.Value);

        var referralRecords = await _db.ReferralRecords
            .AsNoTracking()
            .Where(x => x.ReferrerUserId == request.UserId && !x.IsDeleted)
            .OrderByDescending(x => x.RedeemedAt)
            .Take(500)
            .ToListAsync(cancellationToken);

        var referredUserIds = referralRecords
            .Select(x => x.RefereeUserId)
            .Distinct(StringComparer.Ordinal)
            .ToList();

        var referredUsers = referredUserIds.Count == 0
            ? new Dictionary<string, User>(StringComparer.Ordinal)
            : await _db.Users
                .AsNoTracking()
                .Where(x => referredUserIds.Contains(x.Id))
                .ToDictionaryAsync(x => x.Id, cancellationToken);

        var milestoneAwards = await _db.ReferralMilestoneRewards
            .AsNoTracking()
            .Where(x => x.ReferrerUserId == request.UserId && !x.IsDeleted)
            .ToListAsync(cancellationToken);

        var redeemedRecord = await _db.ReferralRecords
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.RefereeUserId == request.UserId && !x.IsDeleted, cancellationToken);

        string? referredByDisplayName = null;
        if (!string.IsNullOrWhiteSpace(redeemedRecord?.ReferrerUserId))
        {
            referredByDisplayName = await _db.Users
                .AsNoTracking()
                .Where(x => x.Id == redeemedRecord.ReferrerUserId && !x.IsDeleted)
                .Select(x => x.DisplayName)
                .FirstOrDefaultAsync(cancellationToken);
        }

        var currentReferrals = referralRecords.Count;
        var awardedMilestoneKeys = milestoneAwards
            .Select(x => x.MilestoneKey)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var milestoneProgress = (config.Milestones ?? [])
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.ReferralsRequired)
            .Select(milestone => new ReferralMilestoneProgressDto(
                milestone.Key,
                milestone.Title,
                milestone.ReferralsRequired,
                currentReferrals,
                milestone.RewardXp,
                milestone.RewardPremiumDays,
                milestone.RewardLabel,
                milestone.SortOrder,
                milestone.IsActive,
                currentReferrals >= milestone.ReferralsRequired,
                awardedMilestoneKeys.Contains(milestone.Key)))
            .ToList();

        var referrals = referralRecords
            .Select(record =>
            {
                var referee = referredUsers.GetValueOrDefault(record.RefereeUserId);
                return new ReferralInviteeDto(
                    record.Id,
                    record.RefereeUserId,
                    referee?.DisplayName ?? "Unknown User",
                    referee?.Email ?? "-",
                    referee?.IsPremium ?? false,
                    record.RedeemedAt,
                    record.InviterRewardXp,
                    record.InviterRewardPremiumDays);
            })
            .ToList();

        var totalXpEarned = referralRecords.Sum(x => Math.Max(0, x.InviterRewardXp))
            + milestoneAwards.Sum(x => Math.Max(0, x.RewardXp));
        var totalPremiumDaysEarned = referralRecords.Sum(x => Math.Max(0, x.InviterRewardPremiumDays))
            + milestoneAwards.Sum(x => Math.Max(0, x.RewardPremiumDays));

        var summary = new ReferralSummaryDto(
            profile.ReferralCode,
            currentReferrals,
            totalXpEarned,
            totalPremiumDaysEarned,
            redeemedRecord is not null,
            redeemedRecord?.ReferrerUserId,
            referredByDisplayName,
            config,
            milestoneProgress,
            referrals);

        return ApiResponse<ReferralSummaryDto>.Ok(summary);
    }

    private async Task<string> GenerateUniqueReferralCodeAsync(CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < 64; attempt++)
        {
            var candidate = GenerateRandomCode(8);
            var exists = await _db.ReferralProfiles
                .AsNoTracking()
                .AnyAsync(x => !x.IsDeleted && x.ReferralCode == candidate, cancellationToken);

            if (!exists)
            {
                return candidate;
            }
        }

        return Guid.NewGuid().ToString("N")[..10].ToUpperInvariant();
    }

    private static string GenerateRandomCode(int length)
    {
        if (length <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(length));
        }

        Span<char> chars = stackalloc char[length];
        for (var index = 0; index < chars.Length; index++)
        {
            chars[index] = ReferralCodeAlphabet[RandomNumberGenerator.GetInt32(ReferralCodeAlphabet.Length)];
        }

        return new string(chars);
    }
}
