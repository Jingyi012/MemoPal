using MemoPal.Application.Features.LessonProgress.DTOs;
using MemoPal.Application.Features.Words.DTOs;

namespace MemoPal.Application.Features.Lessons.DTOs;

public sealed record LessonDto(
    string Id,
    string PalaceId,
    string Title,
    string? Description,
    int WordCount,
    string? Category,
    string[]? Tag,
    bool? IsCustom,
    bool? IsLocked,
    bool? Completed,
    bool? IsPremium,
    string Privacy,
    string? CreatedBy,
    LessonProgressDto? Progress,
    IReadOnlyList<WordDto>? Words,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? LastSyncedAt,
    bool IsDeleted,
    DateTime? DeletedAt
);

public sealed class LessonUpsertRequest
{
    public string? Id { get; set; }
    public string? PalaceId { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public int WordCount { get; set; }
    public string? Category { get; set; }
    public string[]? Tag { get; set; }
    public bool? IsCustom { get; set; }
    public bool? IsLocked { get; set; }
    public bool? Completed { get; set; }
    public bool? IsPremium { get; set; }
    public string Privacy { get; set; } = "private";
    public string? CreatedBy { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? LastSyncedAt { get; set; }
    public bool? IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}

