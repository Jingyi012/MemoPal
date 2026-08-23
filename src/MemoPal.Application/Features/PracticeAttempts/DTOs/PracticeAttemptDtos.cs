namespace MemoPal.Application.Features.PracticeAttempts.DTOs;

public sealed class PracticeResponseInput
{
    public string MemoryItemId { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int AttemptCount { get; set; } = 1;
    public int ResponseMs { get; set; }
}

public sealed class PracticeAttemptInput
{
    public string ClientAttemptId { get; set; } = string.Empty;
    public string MemorySetId { get; set; } = string.Empty;
    public string Mode { get; set; } = "recall";
    public DateTime? StartedAt { get; set; }
    public int DurationMs { get; set; }
    public IReadOnlyList<PracticeResponseInput> Responses { get; set; } = [];
}

public sealed class PracticeAttemptBatchRequest
{
    public IReadOnlyList<PracticeAttemptInput> Attempts { get; set; } = [];
}

public sealed record PracticeResponseDto(
    string Id,
    string MemoryItemId,
    bool IsCorrect,
    int AttemptCount,
    int ResponseMs,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string? CreatedBy,
    string? UpdatedBy);

public sealed record PracticeAttemptDto(
    string Id,
    string ClientAttemptId,
    string MemorySetId,
    string TechniqueKey,
    string Mode,
    DateTime StartedAt,
    DateTime CompletedAt,
    int DurationMs,
    int CorrectCount,
    int FirstAttemptCorrectCount,
    int TotalCount,
    DateTime? NextReviewAt,
    IReadOnlyList<PracticeResponseDto> Responses,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string? CreatedBy,
    string? UpdatedBy);

public sealed record DueMemoryReviewDto(
    string Id,
    string MemorySetId,
    string MemorySetTitle,
    string TechniqueKey,
    string MemoryItemId,
    int ItemPosition,
    string Prompt,
    DateTime DueAt,
    int IntervalDays,
    int ReviewCount,
    bool LastResultCorrect,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string? CreatedBy,
    string? UpdatedBy);
