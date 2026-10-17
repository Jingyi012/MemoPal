using MemoPal.Application.Features.Companion.Commands;
using MemoPal.Application.Features.Companion.Queries;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.UnitTests;

public sealed class CompanionTests
{
    [Fact]
    public async Task Greeting_Is_Rewarded_Once_Per_Utc_Day_And_Companion_Even_For_Photo_Profile()
    {
        await using var db = CreateDb();
        db.Users.Add(new User { Id = "owner", Email = "owner@example.com", AvatarSource = AvatarSources.Photo, SelectedAvatarId = "fox" });
        db.AvatarDefinitions.Add(new AvatarDefinition { Id = "fox", Key = "fox" });
        await db.SaveChangesAsync();
        var handler = new GreetCompanionCommandHandler(db);

        await handler.Handle(new("owner"), default);
        await handler.Handle(new("owner"), default);

        var result = (await new GetCompanionQueryHandler(db).Handle(new("owner"), default)).Data!;
        Assert.Equal("fox", result.AvatarId);
        Assert.Equal(1, result.BondPoints);
        Assert.Single(result.Memories);
    }

    [Fact]
    public async Task Companion_Read_Is_Isolated_By_Authenticated_User()
    {
        await using var db = CreateDb();
        db.Users.AddRange(
            new User { Id = "owner", Email = "owner@example.com", SelectedAvatarId = "fox" },
            new User { Id = "other", Email = "other@example.com", SelectedAvatarId = "fox" });
        db.AvatarDefinitions.Add(new AvatarDefinition { Id = "fox", Key = "fox" });
        db.CompanionBonds.Add(new CompanionBond { Id = "bond", UserId = "owner", AvatarId = "fox", BondPoints = 45 });
        db.CompanionMemories.Add(new CompanionMemory
        {
            Id = "memory", UserId = "owner", AvatarId = "fox", Type = "practice", OccurredAt = DateTime.UtcNow,
            SummaryEn = "You practiced together.", SummaryZh = "你们一起练习了。"
        });
        db.CompanionMemories.Add(new CompanionMemory
        {
            Id = "milestone-memory", UserId = "owner", AvatarId = "fox", Type = CompanionMemoryTypes.FirstPracticeMilestone,
            OccurredAt = DateTime.UtcNow, SummaryEn = "Your first practice together.", SummaryZh = "你们一起完成了第一次练习。"
        });
        await db.SaveChangesAsync();

        var result = (await new GetCompanionQueryHandler(db).Handle(new("other"), default)).Data!;
        Assert.Equal(0, result.BondPoints);
        Assert.Empty(result.Memories);
    }

    [Fact]
    public async Task Companion_Uses_First_Active_Avatar_When_None_Is_Selected()
    {
        await using var db = CreateDb();
        db.Users.Add(new User { Id = "owner", Email = "owner@example.com", AvatarSource = AvatarSources.Photo });
        db.AvatarDefinitions.Add(new AvatarDefinition { Id = "fallback", Key = "fallback", SortOrder = 1 });
        await db.SaveChangesAsync();

        var result = (await new GetCompanionQueryHandler(db).Handle(new("owner"), default)).Data!;
        Assert.Equal("fallback", result.AvatarId);
    }

    [Fact]
    public async Task Companion_Falls_Back_When_Selected_Avatar_Is_Inactive_Or_Above_User_Level()
    {
        await using var db = CreateDb();
        db.Users.Add(new User { Id = "owner", Email = "owner@example.com", SelectedAvatarId = "invalid", Level = 1 });
        db.AvatarDefinitions.AddRange(
            new AvatarDefinition { Id = "inactive", Key = "inactive", SortOrder = 0, IsActive = false },
            new AvatarDefinition { Id = "locked", Key = "locked", SortOrder = 1, RequiredLevel = 2 },
            new AvatarDefinition { Id = "fallback", Key = "fallback", SortOrder = 2, RequiredLevel = 1 });
        await db.SaveChangesAsync();

        var result = (await new GetCompanionQueryHandler(db).Handle(new("owner"), default)).Data!;
        Assert.Equal("fallback", result.AvatarId);
    }

    [Fact]
    public async Task Today_Practice_Count_Uses_Only_Current_Companion_Events()
    {
        await using var db = CreateDb();
        db.Users.Add(new User { Id = "owner", Email = "owner@example.com", SelectedAvatarId = "fox" });
        db.AvatarDefinitions.Add(new AvatarDefinition { Id = "fox", Key = "fox" });
        db.CompanionMemories.AddRange(
            new CompanionMemory { Id = "today-fox", UserId = "owner", AvatarId = "fox", Type = "practice", OccurredAt = DateTime.UtcNow },
            new CompanionMemory { Id = "today-cat", UserId = "owner", AvatarId = "cat", Type = "practice", OccurredAt = DateTime.UtcNow },
            new CompanionMemory { Id = "greeting", UserId = "owner", AvatarId = "fox", Type = "greeting", OccurredAt = DateTime.UtcNow });
        await db.SaveChangesAsync();

        var result = (await new GetCompanionQueryHandler(db).Handle(new("owner"), default)).Data!;
        Assert.Equal(1, result.TodayPracticeCount);
    }

    [Theory]
    [InlineData(0, "new", 0)]
    [InlineData(12, "new", 48)]
    [InlineData(25, "familiar", 0)]
    [InlineData(62, "familiar", 49)]
    [InlineData(100, "in_sync", 0)]
    [InlineData(200, "in_sync", 50)]
    [InlineData(300, "best_friends", 100)]
    public async Task Stage_And_Progress_Are_Stable_Codes_And_Percentages(int points, string expectedStage, int expectedProgress)
    {
        await using var db = CreateDb();
        db.Users.Add(new User { Id = "owner", Email = "owner@example.com", SelectedAvatarId = "fox" });
        db.AvatarDefinitions.Add(new AvatarDefinition { Id = "fox", Key = "fox" });
        db.CompanionBonds.Add(new CompanionBond { Id = "bond", UserId = "owner", AvatarId = "fox", BondPoints = points });
        await db.SaveChangesAsync();

        var result = (await new GetCompanionQueryHandler(db).Handle(new("owner"), default)).Data!;
        Assert.Equal(expectedStage, result.BondStage);
        Assert.Equal(expectedProgress, result.BondProgress);
    }

    private static AppDbContext CreateDb() => new(new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
}
