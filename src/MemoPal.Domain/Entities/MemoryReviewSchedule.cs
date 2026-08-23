using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class MemoryReviewSchedule : UserOwnedEntity
{
    public string MemorySetId { get; set; } = string.Empty;
    public string MemoryItemId { get; set; } = string.Empty;
    public string? LastAttemptId { get; set; }
    public DateTime DueAt { get; set; }
    public int IntervalDays { get; set; }
    public int ReviewCount { get; set; }
    public bool LastResultCorrect { get; set; }

    public MemorySet? MemorySet { get; set; }
    public MemoryItem? MemoryItem { get; set; }
    public PracticeAttempt? LastAttempt { get; set; }
}
