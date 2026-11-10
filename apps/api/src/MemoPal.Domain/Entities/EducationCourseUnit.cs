using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class EducationCourseUnit : AuditableBaseEntity
{
    public string CourseId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public int Position { get; set; }
}
