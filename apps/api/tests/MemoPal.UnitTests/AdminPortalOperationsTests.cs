using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Dashboard.Admin.Queries;
using MemoPal.Application.Features.Users.Commands;
using MemoPal.Application.Features.Users.DTOs;
using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.UnitTests;

public sealed class AdminPortalOperationsTests
{
    [Fact]
    public async Task Dashboard_Should_Surface_Items_That_Need_Attention()
    {
        await using var db = CreateDb("admin");
        db.Users.AddRange(
            CreateUser("admin", UserRoles.Admin),
            CreateUser("premium", UserRoles.User, isPremium: true));
        var reportedSet = new MemorySet
        {
            UserId = "premium",
            Title = "Reported set",
            Visibility = MemorySetVisibilities.Public,
            CommunityStatus = MemorySetCommunityStatuses.Visible,
            PublishedAt = DateTime.UtcNow,
        };
        reportedSet.Reports.Add(new MemorySetReport
        {
            UserId = "admin",
            Reason = "spam",
            Details = "Repeated advertising",
        });
        db.MemorySets.Add(reportedSet);
        db.PredefinedMemoryLessons.Add(new PredefinedMemoryLesson
        {
            Key = "draft-lesson",
            TitleEn = "Draft",
            TitleZh = "草稿",
            IsPublished = false,
        });
        db.PalaceScenes.Add(new PalaceScene
        {
            Name = "Draft template",
            IsTemplate = true,
            Status = PalaceSceneStatuses.Draft,
        });
        db.UserSubscriptions.Add(new UserSubscription
        {
            UserId = "premium",
            PlanId = "premium",
            Provider = "manual",
            Status = "past_due",
        });
        await db.SaveChangesAsync();

        var result = await new GetDashboardQueryHandler(db)
            .Handle(new GetDashboardQuery(), default);

        Assert.Equal(2, result.Data!.TotalUsers);
        Assert.Equal(1, result.Data.ActivePremiumUsers);
        Assert.Equal(1, result.Data.ReportedCommunityMemorySets);
        Assert.Equal(1, result.Data.DraftPredefinedLessons);
        Assert.Equal(1, result.Data.DraftPalaceScenes);
        Assert.Equal(1, result.Data.PastDueSubscriptions);
    }

    [Fact]
    public async Task Admin_Should_Not_Remove_Own_Access()
    {
        await using var db = CreateDb("admin");
        db.Users.Add(CreateUser("admin", UserRoles.Admin));
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<ConflictAppException>(() =>
            new DeleteManagedUserCommandHandler(db)
                .Handle(new DeleteManagedUserCommand("admin", "admin"), default));

        await Assert.ThrowsAsync<ConflictAppException>(() =>
            new UpdateManagedUserCommandHandler(db, new StubPasswordHasher())
                .Handle(new UpdateManagedUserCommand("admin", "admin", new ManagedUserUpsertRequest
                {
                    Role = UserRoles.User,
                }), default));

        Assert.False((await db.Users.SingleAsync()).IsDeleted);
        Assert.Equal(UserRoles.Admin, (await db.Users.SingleAsync()).Role);
    }

    [Fact]
    public async Task Restoring_User_Should_Also_Restore_User_Stats()
    {
        await using var db = CreateDb("admin");
        var user = CreateUser("member", UserRoles.User);
        user.IsDeleted = true;
        user.DeletedAt = DateTime.UtcNow;
        db.Users.Add(user);
        db.UserStats.Add(new UserStats
        {
            UserId = user.Id,
            IsDeleted = true,
            DeletedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        await new UpdateManagedUserCommandHandler(db, new StubPasswordHasher())
            .Handle(new UpdateManagedUserCommand("admin", user.Id, new ManagedUserUpsertRequest
            {
                IsDeleted = false,
            }), default);

        Assert.False((await db.Users.SingleAsync()).IsDeleted);
        Assert.False((await db.UserStats.SingleAsync()).IsDeleted);
        Assert.Null((await db.UserStats.SingleAsync()).DeletedAt);
    }

    private static AppDbContext CreateDb(string userId) =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options,
            new TestCurrentUserAccessor(userId));

    private static User CreateUser(string id, string role, bool isPremium = false) => new()
    {
        Id = id,
        Email = $"{id}@example.com",
        DisplayName = id,
        PasswordHash = "hash",
        Role = role,
        IsPremium = isPremium,
    };

    private sealed class TestCurrentUserAccessor(string userId) : ICurrentUserAccessor
    {
        public string? UserId { get; } = userId;
    }

    private sealed class StubPasswordHasher : IPasswordHasher
    {
        public string Hash(string password) => password;
        public bool Verify(string password, string hash) => password == hash;
    }
}
