namespace MemoPal.Application.Features.Education.Relationships.DTOs;

public sealed record CreateClassroomRequest(string Name);
public sealed record InviteClassroomMemberRequest(string UserId, string Role);
public sealed record CreateGuardianLinkRequest(string StudentUserId);
public sealed record EducationClassroomDto(string Id, string Name, string Role, DateTime CreatedAt);
public sealed record EducationMembershipDto(
    string Id,
    string ClassroomId,
    string UserId,
    string Role,
    string Status,
    DateTime ExpiresAt,
    DateTime? AcceptedAt,
    string? ClassroomName = null,
    string? UserDisplayName = null);
public sealed record EducationGuardianLinkDto(
    string Id,
    string GuardianUserId,
    string StudentUserId,
    string Status,
    bool StudentConfirmed,
    bool AdminVerified,
    DateTime CreatedAt,
    string? GuardianDisplayName = null,
    string? StudentDisplayName = null);
