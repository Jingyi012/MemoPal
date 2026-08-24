using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Missions.DTOs;
using MemoPal.Application.Features.Missions.Queries;
using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace MemoPal.UnitTests;

public class MissionQueryTests
{
    [Fact]
    public async Task GetUserMissionDashboardQuery_Should_Calculate_Daily_Review_Metric()
    {
        await using var db = CreateDbContext();
        var now = DateTime.UtcNow;

        db.Users.Add(new User
        {
            Id = "user-1",
            Email = "user-1@example.com",
            DisplayName = "User One",
            PasswordHash = "hash",
            Role = UserRoles.User,
            CreatedAt = now,
            UpdatedAt = now
        });

        db.SystemSettings.Add(new SystemSetting
        {
            Id = Guid.NewGuid().ToString("N"),
            Key = SystemSettingKeys.GamificationMissionTemplates,
            Value = JsonSerializer.Serialize(new[]
            {
                new MissionTemplateDto
                {
                    Key = "daily_review_rhythm",
                    Title = "Daily Review Rhythm",
                    MetricType = MissionMetricTypes.ReviewsCompleted,
                    Period = MissionPeriods.Daily,
                    TargetValue = 3,
                    RewardXp = 20,
                    SortOrder = 1,
                    IsActive = true
                }
            }),
            Description = "Mission templates",
            CreatedAt = now,
            UpdatedAt = now
        });

        db.ReviewSchedules.AddRange(
            new ReviewSchedule
            {
                Id = Guid.NewGuid().ToString("N"),
                UserId = "user-1",
                LessonProgressId = "progress-1",
                ReviewRound = 1,
                DueDate = now.AddHours(-2),
                Completed = true,
                CompletedDate = now.AddHours(-1),
                CreatedAt = now.AddHours(-1),
                UpdatedAt = now.AddHours(-1)
            },
            new ReviewSchedule
            {
                Id = Guid.NewGuid().ToString("N"),
                UserId = "user-1",
                LessonProgressId = "progress-2",
                ReviewRound = 2,
                DueDate = now.AddHours(-3),
                Completed = true,
                CompletedDate = now.AddHours(-2),
                CreatedAt = now.AddHours(-2),
                UpdatedAt = now.AddHours(-2)
            },
            new ReviewSchedule
            {
                Id = Guid.NewGuid().ToString("N"),
                UserId = "user-1",
                LessonProgressId = "progress-3",
                ReviewRound = 1,
                DueDate = now.AddDays(-2),
                Completed = true,
                CompletedDate = now.AddDays(-2),
                CreatedAt = now.AddDays(-2),
                UpdatedAt = now.AddDays(-2)
            });

        await db.SaveChangesAsync();

        var handler = new GetUserMissionDashboardQueryHandler(db);
        var response = await handler.Handle(new GetUserMissionDashboardQuery("user-1"), default);

        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.Single(response.Data.Missions);

        var mission = response.Data.Missions[0];
        Assert.Equal("daily_review_rhythm", mission.Key);
        Assert.Equal(2, mission.CurrentValue);
        Assert.Equal(3, mission.TargetValue);
        Assert.False(mission.IsCompleted);
    }

    [Fact]
    public async Task GetMissionTemplatesQuery_Should_Return_Defaults_When_Setting_Missing()
    {
        await using var db = CreateDbContext();
        var handler = new GetMissionTemplatesQueryHandler(db);

        var response = await handler.Handle(new GetMissionTemplatesQuery(), default);

        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.NotEmpty(response.Data);
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        return new AppDbContext(options);
    }
}
