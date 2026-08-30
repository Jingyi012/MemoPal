namespace MemoPal.Application.Features.PredefinedMemoryLessons.DTOs;

public sealed record PredefinedMemoryLessonItemDto(
    string Id,
    int Position,
    string ContentEn,
    string ContentZh,
    DateTime CreatedAt,
    string? CreatedBy,
    DateTime UpdatedAt,
    string? UpdatedBy);

public sealed record PredefinedMemoryLessonDto(
    string Id,
    string Key,
    string TitleEn,
    string TitleZh,
    string DescriptionEn,
    string DescriptionZh,
    string Emoji,
    string CategoryId,
    PredefinedMemoryLessonCategoryDto Category,
    string TechniqueKey,
    string GoalType,
    int SortOrder,
    bool IsPublished,
    bool IsStarterLesson,
    int Version,
    IReadOnlyList<PredefinedMemoryLessonItemDto> Items,
    DateTime CreatedAt,
    string? CreatedBy,
    DateTime UpdatedAt,
    string? UpdatedBy);

public sealed class PredefinedMemoryLessonUpsertRequest
{
    public string Key { get; set; } = string.Empty;
    public string TitleEn { get; set; } = string.Empty;
    public string TitleZh { get; set; } = string.Empty;
    public string DescriptionEn { get; set; } = string.Empty;
    public string DescriptionZh { get; set; } = string.Empty;
    public string Emoji { get; set; } = string.Empty;
    public string CategoryId { get; set; } = string.Empty;
    public string TechniqueKey { get; set; } = "number-peg";
    public string GoalType { get; set; } = "ordered-list";
    public int SortOrder { get; set; }
    public bool IsPublished { get; set; }
    public bool IsStarterLesson { get; set; }
    public int? ExpectedVersion { get; set; }
    public IReadOnlyList<PredefinedMemoryLessonItemInput> Items { get; set; } = [];
}

public sealed record PredefinedMemoryLessonCategoryDto(
    string Id,
    string Key,
    string NameEn,
    string NameZh,
    string DescriptionEn,
    string DescriptionZh,
    string Emoji,
    int SortOrder,
    bool IsActive,
    int Version,
    DateTime CreatedAt,
    string? CreatedBy,
    DateTime UpdatedAt,
    string? UpdatedBy);

public sealed class PredefinedMemoryLessonCategoryUpsertRequest
{
    public string Key { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string NameZh { get; set; } = string.Empty;
    public string DescriptionEn { get; set; } = string.Empty;
    public string DescriptionZh { get; set; } = string.Empty;
    public string Emoji { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public int? ExpectedVersion { get; set; }
}

public sealed class PredefinedMemoryLessonItemInput
{
    public string? Id { get; set; }
    public int Position { get; set; }
    public string ContentEn { get; set; } = string.Empty;
    public string ContentZh { get; set; } = string.Empty;
}
