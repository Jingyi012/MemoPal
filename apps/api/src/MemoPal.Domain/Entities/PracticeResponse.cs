using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class PracticeResponse : AuditableBaseEntity
{
    public string PracticeAttemptId { get; set; } = string.Empty;
    public string MemoryItemId { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int AttemptCount { get; set; }
    public int HintCount { get; set; }
    public int ResponseMs { get; set; }

    public PracticeAttempt? PracticeAttempt { get; set; }
    public MemoryItem? MemoryItem { get; set; }
}
