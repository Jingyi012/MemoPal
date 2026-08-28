using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.PracticeAttempts.Commands;
using MemoPal.Application.Features.PracticeAttempts.DTOs;
using MemoPal.Application.Features.PracticeAttempts.Queries;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.UnitTests;

public sealed class PracticeAttemptTests
{
    [Fact]
    public async Task PracticeAttempt_Should_Be_Idempotent_Audited_And_Schedule_Item_Reviews()
    {
        const string userId = "practice-user";
        await using var db = CreateDbContext(userId);
        SeedMemorySet(db, userId, "set-1", "item-1", "item-2");
        await db.SaveChangesAsync();
        var handler = new CreatePracticeAttemptBatchCommandHandler(db);
        var request = new PracticeAttemptBatchRequest
        {
            Attempts =
            [
                new PracticeAttemptInput
                {
                    ClientAttemptId = "attempt-client-1",
                    MemorySetId = "set-1",
                    Mode = "recall",
                    DurationMs = 5000,
                    Responses =
                    [
                        new PracticeResponseInput { MemoryItemId = "item-1", IsCorrect = true, AttemptCount = 1, ResponseMs = 1200 },
                        new PracticeResponseInput { MemoryItemId = "item-2", IsCorrect = false, AttemptCount = 2, ResponseMs = 1800 }
                    ]
                }
            ]
        };

        var first = await handler.Handle(new CreatePracticeAttemptBatchCommand(userId, request), default);
        var second = await handler.Handle(new CreatePracticeAttemptBatchCommand(userId, request), default);

        var firstAttempt = Assert.Single(first.Data!);
        var secondAttempt = Assert.Single(second.Data!);
        Assert.Equal(firstAttempt.Id, secondAttempt.Id);
        Assert.Equal(1, firstAttempt.CorrectCount);
        Assert.Equal(1, firstAttempt.FirstAttemptCorrectCount);
        Assert.Equal(userId, firstAttempt.CreatedBy);
        Assert.All(firstAttempt.Responses, response => Assert.Equal(userId, response.CreatedBy));
        Assert.Equal(1, await db.PracticeAttempts.CountAsync());
        Assert.Equal(2, await db.PracticeResponses.CountAsync());

        var schedules = await db.MemoryReviewSchedules.OrderBy(x => x.MemoryItemId).ToListAsync();
        Assert.Equal(2, schedules.Count);
        Assert.Equal(1, schedules[0].IntervalDays);
        Assert.True(schedules[0].LastResultCorrect);
        Assert.Equal(0, schedules[1].IntervalDays);
        Assert.False(schedules[1].LastResultCorrect);
        Assert.All(schedules, schedule => Assert.Equal(userId, schedule.CreatedBy));
    }

    [Fact]
    public async Task PracticeAttempt_Should_Reject_Items_From_Another_MemorySet()
    {
        const string userId = "practice-owner";
        await using var db = CreateDbContext(userId);
        SeedMemorySet(db, userId, "set-1", "item-1");
        SeedMemorySet(db, userId, "set-2", "item-2");
        await db.SaveChangesAsync();

        var request = new PracticeAttemptBatchRequest
        {
            Attempts =
            [
                new PracticeAttemptInput
                {
                    ClientAttemptId = "invalid-item-attempt",
                    MemorySetId = "set-1",
                    Responses = [new PracticeResponseInput { MemoryItemId = "item-2", IsCorrect = true }]
                }
            ]
        };

        await Assert.ThrowsAsync<ValidationAppException>(() =>
            new CreatePracticeAttemptBatchCommandHandler(db)
                .Handle(new CreatePracticeAttemptBatchCommand(userId, request), default));
    }

    [Fact]
    public async Task DueReviewQuery_Should_Return_Only_The_Current_Users_Due_Items()
    {
        const string userId = "due-user";
        await using var db = CreateDbContext(userId);
        SeedMemorySet(db, userId, "set-due", "item-due");
        db.MemoryReviewSchedules.Add(new MemoryReviewSchedule
        {
            Id = "schedule-due",
            UserId = userId,
            MemorySetId = "set-due",
            MemoryItemId = "item-due",
            DueAt = DateTime.UtcNow.AddMinutes(-1),
            IntervalDays = 1,
            ReviewCount = 1,
            LastResultCorrect = true
        });
        await db.SaveChangesAsync();

        var result = await new GetDueMemoryReviewsQueryHandler(db)
            .Handle(new GetDueMemoryReviewsQuery(userId), default);

        var due = Assert.Single(result.Data!);
        Assert.Equal("set-due", due.MemorySetId);
        Assert.Equal("item-due", due.MemoryItemId);
        Assert.Equal(userId, due.CreatedBy);
    }

    [Fact]
    public async Task Rehearsal_Should_Not_Advance_Review_Schedule()
    {
        const string userId = "rehearsal-user";
        await using var db = CreateDbContext(userId);
        SeedMemorySet(db, userId, "set-rehearsal", "item-rehearsal");
        var dueAt = DateTime.UtcNow.AddDays(2);
        db.MemoryReviewSchedules.Add(new MemoryReviewSchedule
        {
            Id = "schedule-rehearsal",
            UserId = userId,
            MemorySetId = "set-rehearsal",
            MemoryItemId = "item-rehearsal",
            DueAt = dueAt,
            IntervalDays = 3,
            ReviewCount = 2,
            LastResultCorrect = true
        });
        await db.SaveChangesAsync();

        var result = await new CreatePracticeAttemptBatchCommandHandler(db).Handle(
            new CreatePracticeAttemptBatchCommand(userId, new PracticeAttemptBatchRequest
            {
                Attempts =
                [
                    new PracticeAttemptInput
                    {
                        ClientAttemptId = "rehearsal-attempt-1",
                        MemorySetId = "set-rehearsal",
                        Mode = PracticeModes.Rehearsal,
                        DurationMs = 1000,
                        Responses = [new PracticeResponseInput { MemoryItemId = "item-rehearsal", IsCorrect = true }]
                    }
                ]
            }), default);

        var attempt = Assert.Single(result.Data!);
        Assert.Equal(dueAt, attempt.NextReviewAt);
        var schedule = await db.MemoryReviewSchedules.SingleAsync();
        Assert.Equal(dueAt, schedule.DueAt);
        Assert.Equal(2, schedule.ReviewCount);
        Assert.Null(schedule.LastAttemptId);
    }

    [Fact]
    public async Task Early_Correct_Recall_Should_Preserve_The_Existing_Due_Date()
    {
        const string userId = "early-recall-user";
        await using var db = CreateDbContext(userId);
        SeedMemorySet(db, userId, "set-early", "item-early");
        var dueAt = DateTime.UtcNow.AddDays(1);
        db.MemoryReviewSchedules.Add(new MemoryReviewSchedule
        {
            Id = "schedule-early",
            UserId = userId,
            MemorySetId = "set-early",
            MemoryItemId = "item-early",
            DueAt = dueAt,
            IntervalDays = 1,
            ReviewCount = 1,
            LastResultCorrect = true
        });
        await db.SaveChangesAsync();

        var result = await new CreatePracticeAttemptBatchCommandHandler(db).Handle(
            new CreatePracticeAttemptBatchCommand(userId, new PracticeAttemptBatchRequest
            {
                Attempts =
                [
                    new PracticeAttemptInput
                    {
                        ClientAttemptId = "early-recall-attempt-1",
                        MemorySetId = "set-early",
                        Mode = PracticeModes.Recall,
                        DurationMs = 1000,
                        Responses = [new PracticeResponseInput { MemoryItemId = "item-early", IsCorrect = true }]
                    }
                ]
            }), default);

        var attempt = Assert.Single(result.Data!);
        Assert.Equal(dueAt, attempt.NextReviewAt);
        var schedule = await db.MemoryReviewSchedules.SingleAsync();
        Assert.Equal(dueAt, schedule.DueAt);
        Assert.Equal(1, schedule.ReviewCount);
        Assert.Equal(1, schedule.IntervalDays);
        Assert.True(schedule.LastResultCorrect);
        Assert.Equal(attempt.Id, schedule.LastAttemptId);
    }

    [Fact]
    public async Task UpcomingReviewQuery_Should_Return_Future_Items_Within_Window()
    {
        const string userId = "upcoming-user";
        await using var db = CreateDbContext(userId);
        SeedMemorySet(db, userId, "set-upcoming", "item-soon", "item-later");
        db.MemoryReviewSchedules.AddRange(
            new MemoryReviewSchedule
            {
                Id = "schedule-soon",
                UserId = userId,
                MemorySetId = "set-upcoming",
                MemoryItemId = "item-soon",
                DueAt = DateTime.UtcNow.AddDays(2),
                IntervalDays = 3,
                ReviewCount = 2,
                LastResultCorrect = true
            },
            new MemoryReviewSchedule
            {
                Id = "schedule-later",
                UserId = userId,
                MemorySetId = "set-upcoming",
                MemoryItemId = "item-later",
                DueAt = DateTime.UtcNow.AddDays(10),
                IntervalDays = 7,
                ReviewCount = 3,
                LastResultCorrect = true
            });
        await db.SaveChangesAsync();

        var result = await new GetUpcomingMemoryReviewsQueryHandler(db)
            .Handle(new GetUpcomingMemoryReviewsQuery(userId, 5), default);

        var upcoming = Assert.Single(result.Data!);
        Assert.Equal("item-soon", upcoming.MemoryItemId);
    }

    [Fact]
    public async Task PracticeStatsQuery_Should_Aggregate_Sessions_Words_Accuracy_And_Weekly_Activity()
    {
        const string userId = "stats-user";
        await using var db = CreateDbContext(userId);
        var now = DateTime.UtcNow;
        db.PracticeAttempts.AddRange(
            new PracticeAttempt
            {
                Id = "stats-attempt-1",
                UserId = userId,
                MemorySetId = "stats-set",
                ClientAttemptId = "stats-client-1",
                CompletedAt = now,
                CorrectCount = 2,
                TotalCount = 3,
                Responses =
                [
                    new PracticeResponse { Id = "stats-response-1", MemoryItemId = "word-1", IsCorrect = true },
                    new PracticeResponse { Id = "stats-response-2", MemoryItemId = "word-2", IsCorrect = true },
                    new PracticeResponse { Id = "stats-response-3", MemoryItemId = "word-3", IsCorrect = false }
                ]
            },
            new PracticeAttempt
            {
                Id = "stats-attempt-2",
                UserId = userId,
                MemorySetId = "stats-set",
                ClientAttemptId = "stats-client-2",
                CompletedAt = now.AddDays(-1),
                CorrectCount = 1,
                TotalCount = 1,
                Responses =
                [new PracticeResponse { Id = "stats-response-4", MemoryItemId = "word-1", IsCorrect = true }]
            });
        await db.SaveChangesAsync();

        var result = await new GetPracticeStatsQueryHandler(db)
            .Handle(new GetPracticeStatsQuery(userId), default);

        Assert.True(result.Success);
        Assert.Equal(2, result.Data!.SessionsCompleted);
        Assert.Equal(3, result.Data.WordsLearned);
        Assert.Equal(75, result.Data.AccuracyPercent);
        Assert.Equal(1, result.Data.WeeklyActivity[^1].Sessions);
        Assert.Equal(2, result.Data.WeeklyActivity.Sum(day => day.Sessions));
    }

    private static AppDbContext CreateDbContext(string userId)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        return new AppDbContext(options, new TestCurrentUserAccessor(userId));
    }

    private static void SeedMemorySet(AppDbContext db, string userId, string setId, params string[] itemIds)
    {
        db.MemorySets.Add(new MemorySet
        {
            Id = setId,
            UserId = userId,
            Title = $"Memory {setId}",
            GoalType = MemoryGoalTypes.Custom,
            TechniqueKey = MemoryTechniqueKeys.NumberPeg,
            Status = MemorySetStatuses.Active,
            Visibility = MemorySetVisibilities.Private,
            Items = itemIds.Select((id, index) => new MemoryItem
            {
                Id = id,
                Position = index + 1,
                Prompt = $"Prompt {index + 1}",
                Answer = $"Answer {index + 1}"
            }).ToList()
        });
    }

    private sealed class TestCurrentUserAccessor(string userId) : ICurrentUserAccessor
    {
        public string? UserId { get; } = userId;
    }
}
