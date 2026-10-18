using MemoPal.Domain.Entities;

namespace MemoPal.Application.Features.Education.Relationships.DTOs;

internal static class EducationRelationshipMappings
{
    public static EducationMembershipDto ToDto(EducationMembership membership, string? classroomName = null) =>
        new(membership.Id, membership.ClassroomId, membership.UserId, membership.Role, membership.Status,
            membership.ExpiresAt, membership.AcceptedAt, classroomName);

    public static EducationGuardianLinkDto ToDto(EducationGuardianLink link) =>
        new(link.Id, link.GuardianUserId, link.StudentUserId, link.Status,
            link.StudentConfirmedAt is not null, link.AdminVerifiedAt is not null, link.CreatedAt);
}
