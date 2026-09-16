using MemoPal.Domain.Entities;

namespace MemoPal.UnitTests;

public sealed class MemoryReviewScheduleTests
{
    private static readonly DateTime Now = new(2026, 9, 16, 8, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Independent_Recall_Should_Follow_The_Main_Intervals_And_Cap_At_Thirty_Days()
    {
        var schedule = new MemoryReviewSchedule();
        var completedAt = Now;
        foreach (var days in new[] { 1, 3, 7, 14, 30, 30 })
        {
            schedule.RecordRecall("attempt", true, 1, 0, completedAt);
            Assert.Equal(days, schedule.IntervalDays);
            Assert.Equal(completedAt.AddDays(days), schedule.DueAt);
            completedAt = schedule.DueAt;
        }
        Assert.Equal(6, schedule.ReviewCount);
    }

    [Theory]
    [InlineData(false, 1, 0, 10)]
    [InlineData(true, 2, 0, 1440)]
    [InlineData(true, 1, 1, 1440)]
    [InlineData(true, 3, 3, 1440)]
    public void Difficult_Recall_Should_Preserve_The_Earned_Stage_And_Schedule_Relearning(
        bool correct, int attempts, int hints, int minutes)
    {
        var schedule = MatureSchedule();
        schedule.RecordRecall("difficult", correct, attempts, hints, Now);

        Assert.Equal(3, schedule.ReviewCount);
        Assert.Equal(0, schedule.IntervalDays);
        Assert.Equal(Now.AddMinutes(minutes), schedule.DueAt);
        Assert.Equal(correct, schedule.LastResultCorrect);
        Assert.Equal("difficult", schedule.LastAttemptId);
    }

    [Fact]
    public void First_Hinted_Recall_Should_Have_A_Real_Future_Due_Date()
    {
        var schedule = new MemoryReviewSchedule();
        schedule.RecordRecall("hinted", true, 1, 2, Now);
        Assert.Equal(0, schedule.ReviewCount);
        Assert.Equal(Now.AddDays(1), schedule.DueAt);

        schedule.RecordRecall("independent", true, 1, 0, schedule.DueAt);
        Assert.Equal(1, schedule.ReviewCount);
        Assert.Equal(Now.AddDays(2), schedule.DueAt);
    }

    [Fact]
    public void Forgotten_Mature_Item_Should_Require_A_Day_Of_Confirmation_Before_Advancing()
    {
        var schedule = MatureSchedule();
        schedule.RecordRecall("forgotten", false, 1, 0, Now);
        var relearningAt = schedule.DueAt;
        schedule.RecordRecall("relearned", true, 1, 0, relearningAt);
        Assert.Equal(3, schedule.ReviewCount);
        Assert.Equal(1, schedule.IntervalDays);
        Assert.Equal(relearningAt.AddDays(1), schedule.DueAt);

        schedule.RecordRecall("early", true, 1, 0, relearningAt.AddHours(1));
        Assert.Equal(3, schedule.ReviewCount);
        Assert.Equal(relearningAt.AddDays(1), schedule.DueAt);

        var confirmationAt = schedule.DueAt;
        schedule.RecordRecall("confirmed", true, 1, 0, confirmationAt);
        Assert.Equal(4, schedule.ReviewCount);
        Assert.Equal(confirmationAt.AddDays(14), schedule.DueAt);
    }

    [Fact]
    public void Overdue_Recall_Should_Continue_From_The_Actual_Completion_Time()
    {
        var schedule = MatureSchedule();
        schedule.DueAt = Now.AddDays(-40);
        schedule.RecordRecall("returned", true, 1, 0, Now);
        Assert.Equal(4, schedule.ReviewCount);
        Assert.Equal(Now.AddDays(14), schedule.DueAt);
    }

    [Fact]
    public void Early_Independent_Recall_Should_Keep_The_Existing_Plan()
    {
        var schedule = MatureSchedule();
        schedule.DueAt = Now.AddDays(2);
        schedule.RecordRecall("early", true, 1, 0, Now);
        Assert.Equal(3, schedule.ReviewCount);
        Assert.Equal(7, schedule.IntervalDays);
        Assert.Equal(Now.AddDays(2), schedule.DueAt);
    }

    private static MemoryReviewSchedule MatureSchedule() => new()
    {
        ReviewCount = 3,
        IntervalDays = 7,
        DueAt = Now,
    };
}
