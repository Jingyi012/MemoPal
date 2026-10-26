using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class EducationClassroomCourse : AuditableBaseEntity
{
    public string ClassroomId { get; set; } = string.Empty;
    public string CourseId { get; set; } = string.Empty;
    public string AttachedByUserId { get; set; } = string.Empty;
    public DateTime AttachedAtUtc { get; set; }
}
