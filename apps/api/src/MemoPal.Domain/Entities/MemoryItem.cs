using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class MemoryItem : AuditableBaseEntity
{
    public string MemorySetId { get; set; } = string.Empty;
    public int Position { get; set; }
    public string Prompt { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public string? Hint { get; set; }
    public string? PronunciationAudioUrl { get; set; }
    public string? NormalizedAnswer { get; set; }
    /// <summary>Canonical source item identity for copies; null means this item is an original.</summary>
    public string? OriginMemoryItemId { get; set; }

    public MemorySet? MemorySet { get; set; }
}
