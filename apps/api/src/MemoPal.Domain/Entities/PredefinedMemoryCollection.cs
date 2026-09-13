using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class PredefinedMemoryCollection : AuditableBaseEntity
{
    public string TitleEn { get; set; } = string.Empty;
    public string TitleZh { get; set; } = string.Empty;
    public string DescriptionEn { get; set; } = string.Empty;
    public string DescriptionZh { get; set; } = string.Empty;
    public string Emoji { get; set; } = "📚";
    public string CategoryId { get; set; } = string.Empty;
    public PredefinedMemoryLessonCategory Category { get; set; } = null!;
    public bool IsPublished { get; set; }
    public int SortOrder { get; set; }
    public int Version { get; set; } = 1;
    public ICollection<PredefinedMemoryCollectionLesson> Lessons { get; set; } = new List<PredefinedMemoryCollectionLesson>();
}

public sealed class PredefinedMemoryCollectionLesson
{
    public string CollectionId { get; set; } = string.Empty;
    public PredefinedMemoryCollection Collection { get; set; } = null!;
    public string LessonId { get; set; } = string.Empty;
    public PredefinedMemoryLesson Lesson { get; set; } = null!;
    public int Position { get; set; }
}
