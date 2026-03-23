using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Features.XpEvents.Commands;
using MemoPal.Application.Features.XpEvents.DTOs;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.UnitTests;

public class XpEventTests
{
    [Fact]
    public async Task CreateXpEventCommandHandler_Should_Increment_User_Xp_And_Level()
    {
        await using var db = CreateDbContext();
        db.Users.Add(CreateUser("user-1"));
        SeedLevelConfig(db, 1, 0, "Novice");
        SeedLevelConfig(db, 2, 10, "Learner");
        SeedLevelConfig(db, 3, 25, "Master");
        await db.SaveChangesAsync();

        var handler = new CreateXpEventCommandHandler(db);
        var response = await handler.Handle(
            new CreateXpEventCommand("user-1", new XpEventUpsertRequest
            {
                SourceType = "ReviewComplete",
                SourceId = "review-1",
                ClientEventId = "client-event-1",
                XpAmount = 30
            }),
            default);

        Assert.True(response.Success);
        Assert.NotNull(response.Data);

        var user = await db.Users.SingleAsync(x => x.Id == "user-1");
        Assert.Equal(30, user.TotalXp);
        Assert.Equal(3, user.Level);

        var eventEntity = await db.XpEvents.SingleAsync(x => x.UserId == "user-1");
        Assert.Equal("ReviewComplete", eventEntity.SourceType);
        Assert.Equal("review-1", eventEntity.SourceId);
        Assert.Equal("client-event-1", eventEntity.ClientEventId);
        Assert.Equal(30, eventEntity.XpAmount);
    }

    [Fact]
    public async Task CreateXpEventCommandHandler_Should_Accept_Null_SourceId()
    {
        await using var db = CreateDbContext();
        db.Users.Add(CreateUser("user-1"));
        SeedLevelConfig(db, 1, 0, "Novice");
        await db.SaveChangesAsync();

        var handler = new CreateXpEventCommandHandler(db);
        var response = await handler.Handle(
            new CreateXpEventCommand("user-1", new XpEventUpsertRequest
            {
                SourceType = "ReviewComplete",
                SourceId = null,
                ClientEventId = "client-event-null-source",
                XpAmount = 5
            }),
            default);

        Assert.True(response.Success);
        Assert.NotNull(response.Data);

        var eventEntity = await db.XpEvents.SingleAsync(x => x.UserId == "user-1");
        Assert.Null(eventEntity.SourceId);
    }

    [Fact]
    public async Task CreateXpEventCommandHandler_Should_Be_Idempotent_For_Same_ClientEventId()
    {
        await using var db = CreateDbContext();
        db.Users.Add(CreateUser("user-1"));
        SeedLevelConfig(db, 1, 0, "Novice");
        SeedLevelConfig(db, 2, 10, "Learner");
        await db.SaveChangesAsync();

        var handler = new CreateXpEventCommandHandler(db);
        var request = new XpEventUpsertRequest
        {
            SourceType = "ReviewComplete",
            SourceId = "review-1",
            ClientEventId = "client-event-1",
            XpAmount = 12
        };

        var first = await handler.Handle(new CreateXpEventCommand("user-1", request), default);
        var second = await handler.Handle(new CreateXpEventCommand("user-1", request), default);

        Assert.True(first.Success);
        Assert.True(second.Success);
        Assert.Equal(first.Data?.Id, second.Data?.Id);

        var user = await db.Users.SingleAsync(x => x.Id == "user-1");
        Assert.Equal(12, user.TotalXp);
        Assert.Equal(2, user.Level);

        var eventCount = await db.XpEvents.CountAsync(x => x.UserId == "user-1" && x.ClientEventId == "client-event-1");
        Assert.Equal(1, eventCount);
    }

    [Theory]
    [InlineData(null, "client-event-1", 5)]
    [InlineData("", "client-event-1", 5)]
    [InlineData("ReviewComplete", null, 5)]
    [InlineData("ReviewComplete", "", 5)]
    [InlineData("ReviewComplete", "client-event-1", 0)]
    [InlineData("ReviewComplete", "client-event-1", -1)]
    public async Task CreateXpEventCommandHandler_Should_Throw_Validation_On_Invalid_Payload(string? sourceType, string? clientEventId, int xpAmount)
    {
        await using var db = CreateDbContext();
        db.Users.Add(CreateUser("user-1"));
        SeedLevelConfig(db, 1, 0, "Novice");
        await db.SaveChangesAsync();

        var handler = new CreateXpEventCommandHandler(db);

        await Assert.ThrowsAsync<ValidationAppException>(() =>
            handler.Handle(
                new CreateXpEventCommand("user-1", new XpEventUpsertRequest
                {
                    SourceType = sourceType,
                    ClientEventId = clientEventId,
                    XpAmount = xpAmount
                }),
                default));
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        return new AppDbContext(options);
    }

    private static User CreateUser(string id)
    {
        return new User
        {
            Id = id,
            Email = $"{id}@example.com",
            DisplayName = "Test User",
            PasswordHash = "hash",
            Level = 1,
            TotalXp = 0,
            IsPremium = false
        };
    }

    private static void SeedLevelConfig(AppDbContext db, int level, int requiredXp, string title)
    {
        db.LevelConfigs.Add(new LevelConfig
        {
            Level = level,
            RequiredXp = requiredXp,
            Title = title,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
    }
}
