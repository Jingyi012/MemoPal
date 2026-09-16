using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Features.PracticeAttempts.Queries;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.UnitTests;

public sealed class MemoryReviewProgressTests
{
    [Fact]
    public async Task Progress_Should_Count_All_Rounds_And_Include_Unscheduled_Items()
    {
        await using var db = CreateDb();
        db.MemorySets.Add(new MemorySet { Id = "set", UserId = "owner", Title = "Test memory" });
        db.MemoryItems.AddRange(
            new MemoryItem { Id = "strong", MemorySetId = "set", Position = 1 },
            new MemoryItem { Id = "learning", MemorySetId = "set", Position = 2 },
            new MemoryItem { Id = "new", MemorySetId = "set", Position = 3 },
            new MemoryItem { Id = "deleted", MemorySetId = "set", Position = 4, IsDeleted = true });
        for (var index = 0; index < 25; index++)
        {
            var attempt = new PracticeAttempt
            {
                Id = $"recall-{index}", ClientAttemptId = $"client-{index}",
                UserId = "owner", MemorySetId = "set", Mode = PracticeModes.Recall,
                CompletedAt = DateTime.UtcNow.AddDays(-index),
                Responses = [new PracticeResponse
                {
                    Id = $"response-{index}", MemoryItemId = "strong", IsCorrect = true,
                    AttemptCount = 3, HintCount = 2,
                }],
            };
            if (index < 4) attempt.Responses.Add(new PracticeResponse
            {
                Id = $"learning-{index}", MemoryItemId = "learning", AttemptCount = 1,
                IsDeleted = index == 3,
            });
            db.PracticeAttempts.Add(attempt);
        }
        db.PracticeAttempts.AddRange(
            new PracticeAttempt { Id = "rehearsal", UserId = "owner", MemorySetId = "set", Mode = PracticeModes.Rehearsal },
            new PracticeAttempt { Id = "deleted-recall", UserId = "owner", MemorySetId = "set", Mode = PracticeModes.Recall, IsDeleted = true },
            new PracticeAttempt { Id = "other-set", UserId = "owner", MemorySetId = "another-set", Mode = PracticeModes.Recall });
        var nextDue = DateTime.UtcNow.AddDays(7);
        db.MemoryReviewSchedules.AddRange(
            new MemoryReviewSchedule { Id = "strong-schedule", UserId = "owner", MemorySetId = "set", MemoryItemId = "strong", ReviewCount = 8, IntervalDays = 30, DueAt = nextDue.AddDays(23) },
            new MemoryReviewSchedule { Id = "learning-schedule", UserId = "owner", MemorySetId = "set", MemoryItemId = "learning", ReviewCount = 3, IntervalDays = 7, DueAt = nextDue },
            new MemoryReviewSchedule { Id = "deleted-schedule", UserId = "owner", MemorySetId = "set", MemoryItemId = "deleted", DueAt = nextDue.AddDays(-20) });
        await db.SaveChangesAsync();

        var progress = (await new GetMemoryReviewProgressQueryHandler(db)
            .Handle(new GetMemoryReviewProgressQuery("owner", "set"), default)).Data!;
        Assert.Equal(25, progress.RecallSessionsCompleted);
        Assert.Equal(24, progress.ReviewSessionsCompleted);
        Assert.Equal(new[] { 1, 3, 7, 14, 30 }, progress.StageIntervalsDays);
        Assert.Equal(1, progress.LongTermItemCount);
        Assert.Equal(5, progress.MinimumRemainingRecalls);
        Assert.Equal(nextDue, progress.NextReviewAt);
        Assert.Equal(3, progress.Items.Count);
        Assert.Equal(25, progress.Items[0].RecallSessionsCompleted);
        Assert.Equal(5, progress.Items[0].CompletedStages);
        Assert.Equal(0, progress.Items[0].RemainingRecalls);
        Assert.Equal(3, progress.Items[1].RecallSessionsCompleted);
        Assert.Equal(2, progress.Items[1].RemainingRecalls);
        Assert.Equal(0, progress.Items[2].RecallSessionsCompleted);
        Assert.Equal(0, progress.Items[2].CompletedStages);
        Assert.Null(progress.Items[2].DueAt);
        Assert.All(progress.Items, item => Assert.False(item.IsDue));
    }

    [Fact]
    public async Task Progress_Separates_Due_Future_And_New_Items_And_Excludes_New_Only_Rounds()
    {
        await using var db = CreateDb();
        db.MemorySets.Add(new MemorySet { Id = "set", UserId = "owner" });
        foreach (var id in new[] { "due", "future", "new" })
            db.MemoryItems.Add(new MemoryItem { Id = id, MemorySetId = "set" });
        db.MemoryReviewSchedules.AddRange(
            new MemoryReviewSchedule { Id = "d", UserId = "owner", MemorySetId = "set", MemoryItemId = "due", DueAt = DateTime.UtcNow.AddHours(-1) },
            new MemoryReviewSchedule { Id = "f", UserId = "owner", MemorySetId = "set", MemoryItemId = "future", DueAt = DateTime.UtcNow.AddDays(3) });
        var roundItems = new[] { "due", "future", "due" };
        for (var i = 0; i < roundItems.Length; i++)
            db.PracticeAttempts.Add(new PracticeAttempt
            {
                Id = $"round-{i}", UserId = "owner", MemorySetId = "set", Mode = PracticeModes.Recall,
                CompletedAt = DateTime.UtcNow.AddDays(-3 + i),
                Responses = [new PracticeResponse { Id = $"r-{i}", MemoryItemId = roundItems[i] }],
            });
        await db.SaveChangesAsync();
        var progress = (await new GetMemoryReviewProgressQueryHandler(db)
            .Handle(new GetMemoryReviewProgressQuery("owner", "set"), default)).Data!;
        Assert.Equal(3, progress.RecallSessionsCompleted);
        Assert.Equal(1, progress.ReviewSessionsCompleted);
        Assert.True(progress.Items.Single(item => item.MemoryItemId == "due").IsDue);
        Assert.False(progress.Items.Single(item => item.MemoryItemId == "future").IsDue);
        Assert.False(progress.Items.Single(item => item.MemoryItemId == "new").IsDue);
    }

    [Fact]
    public async Task Empty_Memory_Should_Return_Zero_Counts_Without_Claiming_Completion()
    {
        await using var db = CreateDb();
        db.MemorySets.Add(new MemorySet { Id = "empty", UserId = "owner" });
        await db.SaveChangesAsync();
        var progress = (await new GetMemoryReviewProgressQueryHandler(db)
            .Handle(new GetMemoryReviewProgressQuery("owner", "empty"), default)).Data!;
        Assert.Equal(0, progress.ReviewSessionsCompleted);
        Assert.Null(progress.MinimumRemainingRecalls);
        Assert.Null(progress.NextReviewAt);
        Assert.Empty(progress.Items);
    }

    [Theory]
    [InlineData("intruder", false)]
    [InlineData("owner", true)]
    public async Task Progress_Should_Not_Disclose_Other_Owners_Or_Deleted_Memories(string userId, bool deleted)
    {
        await using var db = CreateDb();
        db.MemorySets.Add(new MemorySet { Id = "private", UserId = "owner", IsDeleted = deleted });
        await db.SaveChangesAsync();
        await Assert.ThrowsAsync<NotFoundAppException>(() => new GetMemoryReviewProgressQueryHandler(db)
            .Handle(new GetMemoryReviewProgressQuery(userId, "private"), default));
    }

    private static AppDbContext CreateDb() => new(new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString("N")).Options);
}
