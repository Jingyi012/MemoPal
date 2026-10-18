using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public static class EducationMembershipRoles
{
    public const string Teacher = "teacher";
    public const string Student = "student";
}

public static class EducationRelationshipStatuses
{
    public const string Pending = "pending";
    public const string Active = "active";
    public const string Revoked = "revoked";
}

public sealed class EducationMembership : AuditableBaseEntity
{
    public string ClassroomId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Role { get; set; } = EducationMembershipRoles.Student;
    public string Status { get; set; } = EducationRelationshipStatuses.Pending;
    public DateTime ExpiresAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
}
