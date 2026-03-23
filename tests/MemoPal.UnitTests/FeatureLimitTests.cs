using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Lessons.Commands;
using MemoPal.Application.Features.Lessons.DTOs;
using MemoPal.Application.Features.Palaces.Commands;
using MemoPal.Application.Features.Palaces.DTOs;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.UnitTests;

public class FeatureLimitTests
{
    [Fact]
    public async Task CreatePalaceCommandHandler_Should_Block_Free_User_When_Custom_Limit_Is_Zero()
    {
        await using var db = CreateDbContext();
        db.Users.Add(CreateUser("user-free", isPremium: false));
        await db.SaveChangesAsync();

        var handler = new CreatePalaceCommandHandler(db);
        var ex = await Assert.ThrowsAsync<ValidationAppException>(() =>
            handler.Handle(
                new CreatePalaceCommand("user-free", new PalaceUpsertRequest
                {
                    Name = "My Palace",
                    Description = "A custom palace",
                    Thumbnail = "thumb.png",
                    IsCustom = true
                }),
                default));

        Assert.Contains("custom palaces", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CreatePalaceCommandHandler_Should_Allow_Premium_User_Up_To_Limit_And_Block_Afterwards()
    {
        await using var db = CreateDbContext();
        db.Users.Add(CreateUser("user-premium", isPremium: true));
        SeedSetting(db, SystemSettingKeys.CustomPalacesPremium, 4);
        db.Palaces.AddRange(
            CreateCustomPalace("palace-1", "user-premium"),
            CreateCustomPalace("palace-2", "user-premium"));
        await db.SaveChangesAsync();

        var handler = new CreatePalaceCommandHandler(db);

        var first = await handler.Handle(BuildCreateCustomPalaceCommand("user-premium", "Palace 3"), default);
        var second = await handler.Handle(BuildCreateCustomPalaceCommand("user-premium", "Palace 4"), default);

        Assert.True(first.Success);
        Assert.True(second.Success);

        var ex = await Assert.ThrowsAsync<ValidationAppException>(() =>
            handler.Handle(BuildCreateCustomPalaceCommand("user-premium", "Palace 5"), default));

        Assert.Contains("custom palaces", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CreateLessonCommandHandler_Should_Block_Free_User_When_Custom_Lesson_Limit_Is_Reached()
    {
        await using var db = CreateDbContext();
        db.Users.Add(CreateUser("user-free", isPremium: false));
        db.Palaces.Add(CreateOfficialPalace("palace-free"));
        db.Lessons.AddRange(
            CreateCustomLesson("lesson-1", "palace-free", "user-free"),
            CreateCustomLesson("lesson-2", "palace-free", "user-free"),
            CreateCustomLesson("lesson-3", "palace-free", "user-free"),
            CreateCustomLesson("lesson-4", "palace-free", "user-free"),
            CreateCustomLesson("lesson-5", "palace-free", "user-free"));
        await db.SaveChangesAsync();

        var handler = new CreateLessonCommandHandler(db);
        var ex = await Assert.ThrowsAsync<ValidationAppException>(() =>
            handler.Handle(BuildCreateLessonCommand("user-free", "palace-free", "Lesson 6"), default));

        Assert.Contains("custom lessons", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CreateLessonCommandHandler_Should_Allow_Premium_User_Up_To_Limit_And_Block_Afterwards()
    {
        await using var db = CreateDbContext();
        db.Users.Add(CreateUser("user-premium", isPremium: true));
        SeedSetting(db, SystemSettingKeys.CustomLessonsPerPalacePremium, 4);
        db.Palaces.Add(CreateOfficialPalace("palace-premium"));
        db.Lessons.AddRange(
            CreateCustomLesson("lesson-1", "palace-premium", "user-premium"),
            CreateCustomLesson("lesson-2", "palace-premium", "user-premium"));
        await db.SaveChangesAsync();

        var handler = new CreateLessonCommandHandler(db);

        var first = await handler.Handle(BuildCreateLessonCommand("user-premium", "palace-premium", "Lesson 3"), default);
        var second = await handler.Handle(BuildCreateLessonCommand("user-premium", "palace-premium", "Lesson 4"), default);

        Assert.True(first.Success);
        Assert.True(second.Success);

        var ex = await Assert.ThrowsAsync<ValidationAppException>(() =>
            handler.Handle(BuildCreateLessonCommand("user-premium", "palace-premium", "Lesson 5"), default));

        Assert.Contains("custom lessons", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        return new AppDbContext(options);
    }

    private static User CreateUser(string id, bool isPremium)
    {
        return new User
        {
            Id = id,
            Email = $"{id}@example.com",
            DisplayName = "Test User",
            PasswordHash = "hash",
            IsPremium = isPremium
        };
    }

    private static Palace CreateCustomPalace(string id, string userId)
    {
        return new Palace
        {
            Id = id,
            Name = $"Palace {id}",
            Description = "Custom palace",
            Thumbnail = "thumb.png",
            LocationsCount = 0,
            IsLocked = false,
            RequiredXp = 0,
            IsPremium = false,
            IsCustom = true,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    private static Palace CreateOfficialPalace(string id)
    {
        return new Palace
        {
            Id = id,
            Name = $"Palace {id}",
            Description = "Official palace",
            Thumbnail = "thumb.png",
            LocationsCount = 0,
            IsLocked = false,
            RequiredXp = 0,
            IsPremium = false,
            IsCustom = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    private static Lesson CreateCustomLesson(string id, string palaceId, string userId)
    {
        return new Lesson
        {
            Id = id,
            PalaceId = palaceId,
            Title = $"Lesson {id}",
            Description = "Custom lesson",
            WordCount = 0,
            Category = "general",
            IsCustom = true,
            IsLocked = false,
            Completed = false,
            IsPremium = false,
            Privacy = "private",
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    private static CreatePalaceCommand BuildCreateCustomPalaceCommand(string userId, string title)
    {
        return new CreatePalaceCommand(userId, new PalaceUpsertRequest
        {
            Name = title,
            Description = "Custom palace",
            Thumbnail = "thumb.png",
            LocationsCount = 0,
            IsCustom = true,
            IsPremium = false,
            IsLocked = false,
            RequiredXp = 0
        });
    }

    private static CreateLessonCommand BuildCreateLessonCommand(string userId, string palaceId, string title)
    {
        return new CreateLessonCommand(userId, new LessonUpsertRequest
        {
            PalaceId = palaceId,
            Title = title,
            WordCount = 0,
            IsCustom = true,
            IsPremium = false,
            IsLocked = false,
            Privacy = "private"
        });
    }

    private static void SeedSetting(AppDbContext db, string key, int value)
    {
        db.SystemSettings.Add(new SystemSetting
        {
            Id = Guid.NewGuid().ToString("N"),
            Key = key,
            Value = value.ToString(System.Globalization.CultureInfo.InvariantCulture)
        });
    }
}
