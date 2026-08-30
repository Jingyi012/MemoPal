using MemoPal.Application.Features.Milestones.Queries;
using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.UnitTests;

public sealed class MilestoneAutoUnlockTests
{
    [Fact]
    public async Task GetMilestones_Should_AutoUnlockEligibleLevelMilestones_WhenMissingUserRows()
    {
        await using var db = CreateDbContext();
        db.Users.Add(CreateUser("user-1", level: 8, totalXp: 8200));
        db.MilestoneDefinitions.AddRange(
            CreateMilestoneDefinition("milestone-level-2", "level_2", 2),
            CreateMilestoneDefinition("milestone-level-3", "level_3", 3),
            CreateMilestoneDefinition("milestone-level-5", "level_5", 5),
            CreateMilestoneDefinition("milestone-level-10", "level_10", 10));
        await db.SaveChangesAsync();

        var handler = new GetMilestonesQueryHandler(db);
        var response = await handler.Handle(new GetMilestonesQuery("user-1"), default);

        Assert.True(response.Success);
        Assert.NotNull(response.Data);

        var byKey = response.Data!.ToDictionary(x => x.Key, x => x);
        Assert.NotNull(byKey["level_2"].AchievedAt);
        Assert.NotNull(byKey["level_3"].AchievedAt);
        Assert.NotNull(byKey["level_5"].AchievedAt);
        Assert.Null(byKey["level_10"].AchievedAt);

        var persistedCount = await db.UserMilestones.CountAsync(x => x.UserId == "user-1" && !x.IsDeleted);
        Assert.Equal(3, persistedCount);
    }

    [Fact]
    public async Task GetMilestone_Should_AutoUnlockSingleMilestone_WhenEligible()
    {
        await using var db = CreateDbContext();
        db.Users.Add(CreateUser("user-2", level: 5, totalXp: 5200));
        db.MilestoneDefinitions.Add(CreateMilestoneDefinition("milestone-level-3", "level_3", 3));
        await db.SaveChangesAsync();

        var handler = new GetMilestoneQueryHandler(db);
        var response = await handler.Handle(new GetMilestoneQuery("user-2", "milestone-level-3"), default);

        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.NotNull(response.Data!.AchievedAt);

        var persisted = await db.UserMilestones.SingleAsync(x => x.UserId == "user-2" && !x.IsDeleted);
        Assert.Equal("milestone-level-3", persisted.MilestoneId);
        Assert.NotNull(persisted.AchievedAt);
    }

    [Fact]
    public async Task GetMilestones_Should_Use_ServerOwned_Practice_And_Streak_Progress()
    {
        await using var db = CreateDbContext();
        db.Users.Add(CreateUser("user-progress", level: 1, totalXp: 20));
        db.UserStats.Add(new UserStats
        {
            UserId = "user-progress",
            LessonsCompleted = 5,
            WordsLearned = 20,
            CurrentStreak = 3,
            LongestStreak = 3,
            LastActiveDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        db.MilestoneDefinitions.AddRange(
            CreateMilestoneDefinition("milestone-sessions", "practice_5", 5, "lessons_completed"),
            CreateMilestoneDefinition("milestone-words", "words_20", 20, "words_learned"),
            CreateMilestoneDefinition("milestone-streak", "streak_3", 3, "streak_days"));
        await db.SaveChangesAsync();

        var response = await new GetMilestonesQueryHandler(db)
            .Handle(new GetMilestonesQuery("user-progress"), default);

        Assert.All(response.Data!, milestone => Assert.NotNull(milestone.AchievedAt));
        Assert.Equal(3, await db.UserMilestones.CountAsync());
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        return new AppDbContext(options);
    }

    private static User CreateUser(string id, int level, int totalXp)
    {
        return new User
        {
            Id = id,
            Email = $"{id}@example.com",
            DisplayName = id,
            PasswordHash = "hash",
            Role = UserRoles.User,
            Level = level,
            TotalXp = totalXp,
            IsPremium = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    private static MilestoneDefinition CreateMilestoneDefinition(
        string id,
        string key,
        int target,
        string conditionType = "level")
    {
        return new MilestoneDefinition
        {
            Id = id,
            Key = key,
            Title = $"Reach {target}",
            ConditionType = conditionType,
            ConditionValue = target,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsDeleted = false
        };
    }
}
