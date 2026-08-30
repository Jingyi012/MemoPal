using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class PredefinedMemoryLesson : AuditableBaseEntity
{
    public string Key { get; set; } = string.Empty;
    public string TitleEn { get; set; } = string.Empty;
    public string TitleZh { get; set; } = string.Empty;
    public string DescriptionEn { get; set; } = string.Empty;
    public string DescriptionZh { get; set; } = string.Empty;
    public string Emoji { get; set; } = string.Empty;
    public string CategoryId { get; set; } = string.Empty;
    public string TechniqueKey { get; set; } = MemoryTechniqueKeys.NumberPeg;
    public string GoalType { get; set; } = MemoryGoalTypes.OrderedList;
    public int SortOrder { get; set; }
    public bool IsPublished { get; set; }
    public bool IsStarterLesson { get; set; }
    public int Version { get; set; } = 1;

    public ICollection<PredefinedMemoryLessonItem> Items { get; set; } = new List<PredefinedMemoryLessonItem>();
    public PredefinedMemoryLessonCategory Category { get; set; } = null!;
}

public sealed class PredefinedMemoryLessonCategory : AuditableBaseEntity
{
    public string Key { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string NameZh { get; set; } = string.Empty;
    public string DescriptionEn { get; set; } = string.Empty;
    public string DescriptionZh { get; set; } = string.Empty;
    public string Emoji { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public int Version { get; set; } = 1;

    public ICollection<PredefinedMemoryLesson> Lessons { get; set; } = new List<PredefinedMemoryLesson>();
}

public sealed class PredefinedMemoryLessonItem : AuditableBaseEntity
{
    public string LessonId { get; set; } = string.Empty;
    public int Position { get; set; }
    public string ContentEn { get; set; } = string.Empty;
    public string ContentZh { get; set; } = string.Empty;

    public PredefinedMemoryLesson Lesson { get; set; } = null!;
}
