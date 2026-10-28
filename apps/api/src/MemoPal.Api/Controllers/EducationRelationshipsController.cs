using MemoPal.Api.Security;
using MediatR;
using MemoPal.Api.Controllers;
using MemoPal.Application.Features.Education.Relationships;
using MemoPal.Application.Features.Education.Relationships.DTOs;
using MemoPal.Application.Features.Education.Relationships.Queries;
using MemoPal.Application.Features.Education.Family.Queries;
using MemoPal.Application.Features.Education.StudyItems;
using MemoPal.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
[Route("v1/education")]
public sealed class EducationRelationshipsController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet("classrooms")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetClassrooms(CancellationToken ct) => Ok(await Sender.Send(new GetClassroomsQuery(GetUserIdOrThrow()), ct));

    [HttpGet("memberships")]
    [RestrictedLearner(RestrictedLearnerAccess.Conditional)]
    public async Task<IActionResult> GetOwnMemberships(CancellationToken ct) => Ok(await Sender.Send(new GetOwnClassroomMembershipsQuery(GetUserIdOrThrow()), ct));

    [HttpPost("classrooms")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> CreateClassroom([FromBody] CreateClassroomRequest request, CancellationToken ct) => Ok(await Sender.Send(new CreateClassroomCommand(GetUserIdOrThrow(), request), ct));

    [HttpPost("classrooms/{classroomId}/courses/{courseId}")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> AttachCourse(string classroomId, string courseId, CancellationToken ct) =>
        Ok(await Sender.Send(new AttachEducationCourseToClassroomCommand(GetUserIdOrThrow(), classroomId, courseId), ct));

    [HttpDelete("classrooms/{classroomId}/courses/{courseId}")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> DetachCourse(string classroomId, string courseId, CancellationToken ct) =>
        Ok(await Sender.Send(new DetachEducationCourseFromClassroomCommand(GetUserIdOrThrow(), classroomId, courseId), ct));

    [HttpPut("classrooms/{classroomId}/courses/{courseId}/guided-practice")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> SetClassroomGuidedPractice(string classroomId, string courseId,
        [FromBody] SetClassroomGuidedPracticeRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new SetClassroomGuidedPracticeCommand(GetUserIdOrThrow(), classroomId, courseId, request), ct));

    [HttpGet("classrooms/{classroomId}/courses")]
    [RestrictedLearner(RestrictedLearnerAccess.Conditional)]
    public async Task<IActionResult> GetClassroomCourses(string classroomId, CancellationToken ct) =>
        Ok(await Sender.Send(new GetEducationClassroomCoursesQuery(GetUserIdOrThrow(), classroomId), ct));

    [HttpGet("classrooms/{id}/members")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetMembers(string id, CancellationToken ct) => Ok(await Sender.Send(new GetClassroomMembersQuery(GetUserIdOrThrow(), id), ct));

    [HttpPost("classrooms/{id}/invitations")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> Invite(string id, [FromBody] InviteClassroomMemberRequest request, CancellationToken ct) => Ok(await Sender.Send(new InviteClassroomMemberCommand(GetUserIdOrThrow(), id, request), ct));

    [HttpPost("memberships/{id}/accept")]
    [RestrictedLearner(RestrictedLearnerAccess.Conditional)]
    public async Task<IActionResult> Accept(string id, CancellationToken ct) => Ok(await Sender.Send(new AcceptClassroomInvitationCommand(GetUserIdOrThrow(), id), ct));

    [HttpDelete("memberships/{id}")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> RevokeMembership(string id, CancellationToken ct) => Ok(await Sender.Send(new RevokeClassroomMembershipCommand(GetUserIdOrThrow(), id), ct));

    [HttpGet("guardian-links")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetGuardianLinks(CancellationToken ct) => Ok(await Sender.Send(new GetGuardianLinksQuery(GetUserIdOrThrow()), ct));

    [HttpGet("family/children")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetVerifiedChildren(CancellationToken ct) =>
        Ok(await Sender.Send(new GetEducationFamilyChildrenQuery(GetUserIdOrThrow()), ct));

    [HttpGet("family/children/{studentUserId}/report")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetChildReport(string studentUserId, CancellationToken ct) =>
        Ok(await Sender.Send(new GetEducationFamilyReportQuery(GetUserIdOrThrow(), studentUserId), ct));

    [Authorize(Roles = UserRoles.Admin)]
    [HttpGet("admin/guardian-links/pending-verification")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetPendingGuardianVerifications(CancellationToken ct) => Ok(await Sender.Send(new GetPendingGuardianVerificationsQuery(), ct));

    [HttpPost("guardian-links")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> CreateGuardianLink([FromBody] CreateGuardianLinkRequest request, CancellationToken ct) => Ok(await Sender.Send(new CreateGuardianLinkCommand(GetUserIdOrThrow(), request), ct));

    [HttpPost("guardian-links/{id}/confirm")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> ConfirmGuardianLink(string id, CancellationToken ct) => Ok(await Sender.Send(new ConfirmGuardianLinkCommand(GetUserIdOrThrow(), id), ct));

    [Authorize(Roles = UserRoles.Admin)]
    [HttpPost("guardian-links/{id}/verify")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> VerifyGuardianLink(string id, CancellationToken ct) => Ok(await Sender.Send(new VerifyGuardianLinkCommand(GetUserIdOrThrow(), id), ct));

    [HttpDelete("guardian-links/{id}")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> RevokeGuardianLink(string id, CancellationToken ct) => Ok(await Sender.Send(new RevokeGuardianLinkCommand(GetUserIdOrThrow(), id), ct));
}
