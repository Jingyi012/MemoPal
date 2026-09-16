namespace MemoPal.Application.Features.PracticeAttempts.DTOs;

public sealed record MemoryItemReviewProgressDto(
    string MemoryItemId,
    int RecallSessionsCompleted,
    int CompletedStages,
    int RemainingRecalls,
    bool NeedsRelearning,
    DateTime? DueAt,
    bool IsDue);

public sealed record MemoryReviewProgressDto(
    string MemorySetId,
    int RecallSessionsCompleted,
    int ReviewSessionsCompleted,
    IReadOnlyList<int> StageIntervalsDays,
    int LongTermItemCount,
    int? MinimumRemainingRecalls,
    DateTime? NextReviewAt,
    IReadOnlyList<MemoryItemReviewProgressDto> Items);
