using MemoPal.Application.Features.Palaces.Queries;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.UnitTests;

public class PalaceLockQueryTests
{
    [Fact]
    public async Task GetPalacesQuery_Should_Keep_Level_Lock_When_UserLevel_Is_Below_Requirement()
    {
        await using var db = CreateDbContext();
        const string userId = "user-1";
        const string palaceId = "palace-level-5";

        db.Users.Add(CreateUser(userId, level: 1, isPremium: false));
        db.Palaces.Add(CreateOfficialPalace(palaceId, level: 5));
        db.UserPalaces.Add(CreateRelation(userId, palaceId, isUnlocked: true));
        await db.SaveChangesAsync();

        var handler = new GetPalacesQueryHandler(db);
        var response = await handler.Handle(new GetPalacesQuery(userId), default);

        Assert.True(response.Success);
        var palace = Assert.Single(response.Data!);
        Assert.True(palace.IsLocked);
    }

    [Fact]
    public async Task GetPalaceQuery_Should_Keep_Level_Lock_When_UserLevel_Is_Below_Requirement()
    {
        await using var db = CreateDbContext();
        const string userId = "user-1";
        const string palaceId = "palace-level-5";

        db.Users.Add(CreateUser(userId, level: 1, isPremium: false));
        db.Palaces.Add(CreateOfficialPalace(palaceId, level: 5));
        db.UserPalaces.Add(CreateRelation(userId, palaceId, isUnlocked: true));
        await db.SaveChangesAsync();

        var handler = new GetPalaceQueryHandler(db);
        var response = await handler.Handle(new GetPalaceQuery(userId, palaceId), default);

        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.True(response.Data!.IsLocked);
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        return new AppDbContext(options);
    }

    private static User CreateUser(string id, int level, bool isPremium)
    {
        return new User
        {
            Id = id,
            Email = $"{id}@example.com",
            DisplayName = "Test User",
            PasswordHash = "hash",
            Level = level,
            IsPremium = isPremium
        };
    }

    private static Palace CreateOfficialPalace(string id, int level)
    {
        return new Palace
        {
            Id = id,
            Name = $"Palace {id}",
            Description = "Official palace",
            Thumbnail = "thumb.png",
            Level = level,
            IsPremium = false,
            IsCustom = false,
            IsLocked = false,
            LocationsCount = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    private static UserPalace CreateRelation(string userId, string palaceId, bool isUnlocked)
    {
        return new UserPalace
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = userId,
            PalaceId = palaceId,
            IsOwner = false,
            IsUnlocked = isUnlocked,
            UnlockedAt = isUnlocked ? DateTime.UtcNow : null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }
}
