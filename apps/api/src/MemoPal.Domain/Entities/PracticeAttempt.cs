using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class PracticeAttempt : UserOwnedEntity
{
    public string MemorySetId { get; set; } = string.Empty;
    public string ClientAttemptId { get; set; } = string.Empty;
    public string TechniqueKey { get; set; } = string.Empty;
    public string Mode { get; set; } = PracticeModes.Recall;
    public DateTime StartedAt { get; set; }
    public DateTime CompletedAt { get; set; }
    public int DurationMs { get; set; }
    public int CorrectCount { get; set; }
    public int FirstAttemptCorrectCount { get; set; }
    public int TotalCount { get; set; }

    public MemorySet? MemorySet { get; set; }
    public ICollection<PracticeResponse> Responses { get; set; } = new List<PracticeResponse>();
}

public static class PracticeModes
{
    public const string Recall = "recall";
    public const string Rehearsal = "rehearsal";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal)
    {
        Recall,
        Rehearsal
    };
}
