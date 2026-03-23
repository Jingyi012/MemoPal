using MemoPal.Application.Features.LessonProgress.Queries;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.UnitTests;

public class LessonProgressQueryTests
{
    [Fact]
    public async Task GetLessonProgressQuery_Should_Create_Default_Progress_When_Missing()
    {
        await using var db = CreateDbContext();
        const string userId = "user-1";
        const string lessonId = "lesson-1";

        await SeedLessonAsync(db, userId, lessonId);

        var handler = new GetLessonProgressQueryHandler(db);
        var response = await handler.Handle(new GetLessonProgressQuery(userId, lessonId), default);

        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.Equal(lessonId, response.Data.LessonId);
        Assert.Equal("new", response.Data.MasteryLevel);
        Assert.Equal(0, response.Data.TotalReviews);
        Assert.Empty(response.Data.ReviewSchedules);

        var persisted = await db.LessonProgresses.FirstOrDefaultAsync(x => x.UserId == userId && x.LessonId == lessonId);
        Assert.NotNull(persisted);
        Assert.Equal("new", persisted!.MasteryLevel);
    }

    [Fact]
    public async Task GetLessonProgressQuery_Should_Return_Existing_Progress_When_Available()
    {
        await using var db = CreateDbContext();
        const string userId = "user-2";
        const string lessonId = "lesson-2";

        await SeedLessonAsync(db, userId, lessonId);

        db.LessonProgresses.Add(new LessonProgress
        {
            Id = "progress-2",
            UserId = userId,
            LessonId = lessonId,
            MasteryLevel = "learning",
            TotalReviews = 3,
            XpEarned = 45,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var handler = new GetLessonProgressQueryHandler(db);
        var response = await handler.Handle(new GetLessonProgressQuery(userId, lessonId), default);

        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.Equal("learning", response.Data.MasteryLevel);
        Assert.Equal(3, response.Data.TotalReviews);
        Assert.Equal(45, response.Data.XpEarned);
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        return new AppDbContext(options);
    }

    private static async Task SeedLessonAsync(AppDbContext db, string userId, string lessonId)
    {
        db.Users.Add(new User
        {
            Id = userId,
            Email = $"{userId}@example.com",
            DisplayName = userId,
            PasswordHash = "hash"
        });

        db.Palaces.Add(new Palace
        {
            Id = "palace-" + lessonId,
            Name = "Palace " + lessonId,
            Description = "Test palace",
            Thumbnail = "thumb.png",
            LocationsCount = 0,
            IsLocked = false,
            Level = 1,
            IsPremium = false,
            IsCustom = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        db.Lessons.Add(new Lesson
        {
            Id = lessonId,
            PalaceId = "palace-" + lessonId,
            Title = "Lesson " + lessonId,
            Description = "Test lesson",
            WordCount = 0,
            IsCustom = false,
            IsLocked = false,
            Completed = false,
            IsPremium = false,
            Privacy = "private",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        await db.SaveChangesAsync();
    }
}
