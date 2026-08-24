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
