using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class EducationClassroom : AuditableBaseEntity
{
    public string OwnerUserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}
