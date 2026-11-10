using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Referrals.Commands;
using MemoPal.Application.Features.Referrals.DTOs;
using MemoPal.Application.Features.Referrals.Queries;
using MemoPal.Application.Features.Referrals;
using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace MemoPal.UnitTests;

public sealed class ReferralModuleTests
{
    [Fact]
    public async Task GetReferralSummary_Should_Create_Profile_When_Missing()
    {
        await using var db = CreateDbContext();
        db.Users.Add(CreateUser("user-1", "user1@example.com", "User One"));
        await db.SaveChangesAsync();

        var handler = new GetReferralSummaryQueryHandler(db);
        var response = await handler.Handle(new GetReferralSummaryQuery("user-1"), default);

        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.False(string.IsNullOrWhiteSpace(response.Data!.ReferralCode));

        var profile = await db.ReferralProfiles.SingleAsync(x => x.UserId == "user-1");
        Assert.Equal(response.Data.ReferralCode, profile.ReferralCode);
    }

    [Fact]
    public async Task RedeemReferralCode_Should_Grant_Rewards_And_Prevent_Duplicate_Redemption()
    {
        await using var db = CreateDbContext();
        var referrer = CreateUser("referrer-1", "referrer@example.com", "Referrer");
        var invitee = CreateUser("invitee-1", "invitee@example.com", "Invitee");
        db.Users.AddRange(referrer, invitee);
        SeedLevelConfigsSetting(db, (1, 0, "Novice"));
        db.ReferralProfiles.Add(new ReferralProfile
        {
            Id = "profile-referrer",
            UserId = referrer.Id,
            ReferralCode = "REF12345",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var handler = new RedeemReferralCodeCommandHandler(db);
        var response = await handler.Handle(
            new RedeemReferralCodeCommand(invitee.Id, new RedeemReferralRequest { Code = "REF12345" }),
            default);

        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.Equal(0, response.Data!.InviterAwardedXp);
        Assert.Equal(0, response.Data.InviteeAwardedXp);
        Assert.Equal(180, response.Data.InviterAwardedAiCredits);
        Assert.Equal(40, response.Data.InviteeAwardedAiCredits);
        Assert.Empty(await db.XpEvents.ToListAsync());
        Assert.Equal(0, referrer.TotalXp);
        Assert.Equal(0, invitee.TotalXp);
        Assert.Equal(180, await db.AiCreditGrants.Where(x => x.UserId == referrer.Id).SumAsync(x => x.Remaining));
        Assert.Equal(40, await db.AiCreditGrants.Where(x => x.UserId == invitee.Id).SumAsync(x => x.Remaining));
        Assert.Equal(3, await db.AiCreditEntries.CountAsync(x => x.Kind == "referral-reward"));

        var referralRecord = await db.ReferralRecords.SingleAsync(x => x.RefereeUserId == invitee.Id);
        Assert.Equal(referrer.Id, referralRecord.ReferrerUserId);
        Assert.Equal("REF12345", referralRecord.ReferralCode);

        var inviteeAfter = await db.Users.SingleAsync(x => x.Id == invitee.Id);
        Assert.Equal(referrer.Id, inviteeAfter.ReferredByUserId);
        Assert.True(inviteeAfter.IsPremium);

        var referrerAfter = await db.Users.SingleAsync(x => x.Id == referrer.Id);
        Assert.True(referrerAfter.IsPremium);

        var subscriptionCount = await db.UserSubscriptions.CountAsync(x => x.Provider == "referral");
        Assert.True(subscriptionCount >= 2);

        var referrerNotifications = await db.Notifications
            .Where(x => x.UserId == referrer.Id && !x.IsDeleted)
            .ToListAsync();
        Assert.Single(referrerNotifications);
        Assert.Equal("referral", referrerNotifications[0].Type);
        Assert.Equal(referralRecord.Id, referrerNotifications[0].ReferenceId);
        Assert.Contains("180 AI credits", referrerNotifications[0].Body);
        Assert.DoesNotContain("XP", referrerNotifications[0].Body);

        await Assert.ThrowsAsync<ValidationAppException>(() =>
            handler.Handle(
                new RedeemReferralCodeCommand(invitee.Id, new RedeemReferralRequest { Code = "REF12345" }),
                default));
        Assert.Equal(3, await db.AiCreditGrants.CountAsync());
        Assert.Equal(3, await db.AiCreditEntries.CountAsync());

        var summary = (await new GetReferralSummaryQueryHandler(db).Handle(new(referrer.Id), default)).Data!;
        Assert.Equal(180, summary.TotalAiCreditsEarned);
        Assert.Equal(0, summary.TotalXpEarned);
    }

    [Fact]
    public void LegacySettings_ConvertFutureRewardsOneForOne_AndExplicitZeroCreditsStayZero()
    {
        var legacy = ReferralProgramConfigSerializer.ParseOrDefault("""
            {"inviterRewardXp":31,"inviteeRewardXp":17,"milestones":[
              {"key":"custom","title":"Custom","referralsRequired":2,"rewardXp":9,"rewardLabel":"9 XP"}
            ]}
            """);
        Assert.Equal(31, legacy.InviterRewardAiCredits);
        Assert.Equal(17, legacy.InviteeRewardAiCredits);
        Assert.Equal(0, legacy.InviterRewardXp);
        Assert.Equal(9, legacy.Milestones.Single().RewardAiCredits);
        Assert.Null(legacy.Milestones.Single().RewardLabel);
        var updated = ReferralProgramConfigSerializer.ParseOrDefault("""
            {"inviterRewardXp":80,"inviterRewardAiCredits":0,"inviteeRewardAiCredits":-5,
             "milestones":[{"key":"custom","rewardXp":100,"rewardAiCredits":0}]}
            """);
        Assert.Equal(0, updated.InviterRewardAiCredits);
        Assert.Equal(0, updated.InviteeRewardAiCredits);
        Assert.Equal(0, updated.Milestones.Single().RewardAiCredits);
        Assert.Equal(0, updated.Milestones.Single().RewardXp);
    }

    [Fact]
    public async Task ReferralCapAndMilestoneHistory_DoNotGrantCreditsTwiceOrConvertPastXp()
    {
        await using var db = CreateDbContext();
        var referrer = CreateUser("ref", "ref@example.test", "Referrer");
        var first = CreateUser("first", "first@example.test", "First");
        var second = CreateUser("second", "second@example.test", "Second");
        referrer.TotalXp = 123;
        db.Users.AddRange(referrer, first, second);
        db.ReferralProfiles.Add(new() { Id = "profile", UserId = referrer.Id, ReferralCode = "CODE1234" });
        db.ReferralMilestoneRewards.Add(new() { Id = "old-award", ReferrerUserId = referrer.Id,
            MilestoneKey = "referral_1", ReferralsRequired = 1, RewardXp = 100, AwardedAt = DateTime.UtcNow });
        var config = ReferralProgramConfigSerializer.GetDefault();
        config.MaxSuccessfulReferralsPerUser = 1;
        db.SystemSettings.Add(new() { Id = "config", Key = SystemSettingKeys.GrowthReferralProgramConfig,
            Value = ReferralProgramConfigSerializer.Serialize(config) });
        await db.SaveChangesAsync();
        var handler = new RedeemReferralCodeCommandHandler(db);
        var one = (await handler.Handle(new(first.Id, new() { Code = "CODE1234" }), default)).Data!;
        var two = (await handler.Handle(new(second.Id, new() { Code = "CODE1234" }), default)).Data!;
        Assert.Equal(80, one.InviterAwardedAiCredits);
        Assert.Equal(0, two.InviterAwardedAiCredits);
        Assert.Equal(40, two.InviteeAwardedAiCredits);
        Assert.Empty(two.NewlyAwardedMilestones);
        Assert.Equal(123, referrer.TotalXp);
        Assert.Single(await db.ReferralMilestoneRewards.ToListAsync());
        var summary = (await new GetReferralSummaryQueryHandler(db).Handle(new(referrer.Id), default)).Data!;
        Assert.Equal(80, summary.TotalAiCreditsEarned);
        Assert.Equal(100, summary.TotalXpEarned);
        Assert.Equal(0, summary.Milestones.Single(x => x.Key == "referral_1").RewardAiCredits);
        Assert.Equal(100, summary.Milestones.Single(x => x.Key == "referral_1").RewardXp);
    }

    [Fact]
    public async Task RedeemReferralCode_Should_Reject_Self_Referral()
    {
        await using var db = CreateDbContext();
        var user = CreateUser("user-1", "user1@example.com", "User One");
        db.Users.Add(user);
        SeedLevelConfigsSetting(db, (1, 0, "Novice"));
        db.ReferralProfiles.Add(new ReferralProfile
        {
            Id = "profile-user",
            UserId = user.Id,
            ReferralCode = "SELF1234",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var handler = new RedeemReferralCodeCommandHandler(db);

        await Assert.ThrowsAsync<ValidationAppException>(() =>
            handler.Handle(
                new RedeemReferralCodeCommand(user.Id, new RedeemReferralRequest { Code = "SELF1234" }),
                default));
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        return new AppDbContext(options);
    }

    private static User CreateUser(string id, string email, string displayName)
    {
        return new User
        {
            Id = id,
            Email = email,
            DisplayName = displayName,
            PasswordHash = "hash",
            Role = UserRoles.User,
            Level = 1,
            TotalXp = 0,
            IsPremium = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    private static void SeedLevelConfigsSetting(AppDbContext db, params (int Level, int RequiredXp, string Title)[] items)
    {
        var now = DateTime.UtcNow;
        var payload = items.Select(item => new
        {
            level = item.Level,
            requiredXp = item.RequiredXp,
            title = item.Title,
            createdAt = now,
            updatedAt = now
        });

        db.SystemSettings.Add(new SystemSetting
        {
            Id = Guid.NewGuid().ToString("N"),
            Key = SystemSettingKeys.LevelConfigs,
            Value = JsonSerializer.Serialize(payload),
            Description = "Level configs",
            CreatedAt = now,
            UpdatedAt = now
        });
    }
}
