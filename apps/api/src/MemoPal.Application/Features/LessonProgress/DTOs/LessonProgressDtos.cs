using MemoPal.Application.Features.Reviews.DTOs;

namespace MemoPal.Application.Features.LessonProgress.DTOs;

public sealed record LessonProgressDto(
    string Id,
    string LessonId,
    DateTime? FirstCompletedDate,
    IReadOnlyList<ReviewScheduleDto> ReviewSchedules,
    int TotalReviews,
    string MasteryLevel,
    DateTime? LastReviewDate,
    int XpEarned,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    bool IsDeleted,
    DateTime? DeletedAt
);

public sealed class LessonProgressUpsertRequest
{
    public string? Id { get; set; }
    public string? LessonId { get; set; }
    public DateTime? FirstCompletedDate { get; set; }
    public IReadOnlyList<ReviewScheduleUpsertRequest>? ReviewSchedules { get; set; }
    public int TotalReviews { get; set; }
    public string MasteryLevel { get; set; } = "new";
    public DateTime? LastReviewDate { get; set; }
    public int XpEarned { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool? IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}

public sealed class ProgressBatchRequest
{
    public IReadOnlyList<LessonProgressUpsertRequest> Data { get; set; } = [];
}

