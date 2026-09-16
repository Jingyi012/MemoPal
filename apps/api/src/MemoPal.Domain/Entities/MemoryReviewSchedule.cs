using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class MemoryReviewSchedule : UserOwnedEntity
{
    private static readonly int[] RecallIntervalsDays = [1, 3, 7, 14, 30];
    public static IReadOnlyList<int> StageIntervalsDays { get; } = Array.AsReadOnly(RecallIntervalsDays);

    public string MemorySetId { get; set; } = string.Empty;
    public string MemoryItemId { get; set; } = string.Empty;
    public string? LastAttemptId { get; set; }
    public DateTime DueAt { get; set; }
    public int IntervalDays { get; set; }
    public int ReviewCount { get; set; }
    public bool LastResultCorrect { get; set; }

    public int GetRemainingRecallsToLongTerm()
    {
        // Retaining an earned stage during relearning does not mean the item
        // has returned to its long-term interval yet.
        if (ReviewCount >= RecallIntervalsDays.Length && IntervalDays < RecallIntervalsDays[^1])
            return IntervalDays == 0 ? 2 : 1;

        var remaining = Math.Max(0, RecallIntervalsDays.Length - ReviewCount);
        return remaining + (IntervalDays == 0 && ReviewCount > 0 ? 1 : 0);
    }

    public void RecordRecall(string attemptId, bool isCorrect, int attemptCount, int hintCount, DateTime now)
    {
        LastAttemptId = attemptId;
        LastResultCorrect = isCorrect;
        UpdatedAt = now;

        if (!isCorrect || attemptCount > 1 || hintCount > 0)
        {
            // Keep the earned stage. Zero interval marks short-term relearning,
            // including an assisted success which needs an independent check.
            IntervalDays = 0;
            DueAt = isCorrect ? now.AddDays(1) : now.AddMinutes(10);
            return;
        }

        if (DueAt > now) return;

        if (IntervalDays == 0 && ReviewCount > 0)
        {
            // After relearning, confirm recall a day later before advancing
            // the retained stage. Same-session retries cannot pass this gate.
            IntervalDays = 1;
        }
        else
        {
            ReviewCount += 1;
            IntervalDays = RecallIntervalsDays[Math.Min(ReviewCount - 1, RecallIntervalsDays.Length - 1)];
        }

        DueAt = now.AddDays(IntervalDays);
    }

    public MemorySet? MemorySet { get; set; }
    public MemoryItem? MemoryItem { get; set; }
    public PracticeAttempt? LastAttempt { get; set; }
}
