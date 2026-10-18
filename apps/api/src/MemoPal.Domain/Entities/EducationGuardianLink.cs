using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class EducationGuardianLink : AuditableBaseEntity
{
    public string GuardianUserId { get; set; } = string.Empty;
    public string StudentUserId { get; set; } = string.Empty;
    public string Status { get; set; } = EducationRelationshipStatuses.Pending;
    public DateTime? StudentConfirmedAt { get; set; }
    public DateTime? AdminVerifiedAt { get; set; }
    public string? AdminVerifiedBy { get; set; }

    public bool GrantsAccess => Status == EducationRelationshipStatuses.Active &&
        StudentConfirmedAt.HasValue && AdminVerifiedAt.HasValue && !IsDeleted;
}
