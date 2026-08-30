using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Referrals.Commands;
using MemoPal.Application.Features.Referrals.DTOs;
using MemoPal.Application.Features.Referrals.Queries;
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
        Assert.True(response.Data!.InviterAwardedXp > 0);
        Assert.True(response.Data.InviteeAwardedXp > 0);

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

        await Assert.ThrowsAsync<ValidationAppException>(() =>
            handler.Handle(
                new RedeemReferralCodeCommand(invitee.Id, new RedeemReferralRequest { Code = "REF12345" }),
                default));
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
