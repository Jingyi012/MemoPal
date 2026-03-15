namespace MemoPal.Application.Features.Reviews.DTOs;

public sealed record ReviewScheduleDto(
    string Id,
    string LessonProgressId,
    int ReviewRound,
    DateTime DueDate,
    bool Completed,
    DateTime? CompletedDate,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    bool IsDeleted,
    DateTime? DeletedAt
);

public sealed class ReviewScheduleUpsertRequest
{
    public string? Id { get; set; }
    public string? LessonProgressId { get; set; }
    public int ReviewRound { get; set; }
    public DateTime DueDate { get; set; }
    public bool Completed { get; set; }
    public DateTime? CompletedDate { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool? IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}

public sealed class CompleteReviewRequest
{
    public int? CorrectCount { get; set; }
    public int? TotalCount { get; set; }
}

public sealed record ReviewStatsDto(int TotalReviews, int CompletedReviews, int PendingReviews, int DueReviews);

