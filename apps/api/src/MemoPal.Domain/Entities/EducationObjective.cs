using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class EducationObjective : AuditableBaseEntity
{
    public string CourseId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? RecommendedMemorySetId { get; set; }
    public EducationCourse? Course { get; set; }
}
