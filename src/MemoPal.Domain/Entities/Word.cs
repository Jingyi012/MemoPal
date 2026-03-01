using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class Word : AuditableBaseEntity
{
    public string LessonId { get; set; } = string.Empty;
    public string LocationId { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public string? Meaning { get; set; }

    public Lesson? Lesson { get; set; }
    public Location? Location { get; set; }
}


