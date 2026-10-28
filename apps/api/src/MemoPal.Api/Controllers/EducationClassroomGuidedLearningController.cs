using MemoPal.Api.Security;
using MediatR;
using MemoPal.Api.Controllers;
using MemoPal.Application.Features.Education.GuidedLearning.Commands;
using MemoPal.Application.Features.Education.GuidedLearning.DTOs;
using MemoPal.Application.Features.Education.GuidedLearning.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
[Route("v1/education/classrooms/{classroomId}/guided")]
public sealed class EducationClassroomGuidedLearningController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet("courses/{courseId}/progress")]
    [RestrictedLearner(RestrictedLearnerAccess.Conditional)]
    public async Task<IActionResult> GetCourseProgress(string classroomId, string courseId, CancellationToken ct) =>
        Ok(await Sender.Send(new GetEducationGuidedCourseProgressQuery(GetUserIdOrThrow(), courseId, classroomId), ct));

    [HttpGet("courses/{courseId}/assessments/{assessmentId}/learning-content")]
    [RestrictedLearner(RestrictedLearnerAccess.Conditional)]
    public async Task<IActionResult> GetLearningContent(string classroomId, string courseId, string assessmentId, CancellationToken ct) =>
        Ok(await Sender.Send(new GetEducationClassroomLearningContentQuery(
            GetUserIdOrThrow(), classroomId, courseId, assessmentId), ct));

    [HttpPost("courses/{courseId}/assessments/{assessmentId}/sessions")]
    [RestrictedLearner(RestrictedLearnerAccess.Conditional)]
    public async Task<IActionResult> StartOrResume(string classroomId, string courseId, string assessmentId, CancellationToken ct) =>
        Ok(await Sender.Send(new StartOrResumeEducationGuidedLearningSessionCommand(
            GetUserIdOrThrow(), courseId, assessmentId, classroomId), ct));

    [HttpGet("sessions/{sessionId}")]
    [RestrictedLearner(RestrictedLearnerAccess.Conditional)]
    public async Task<IActionResult> GetSession(string classroomId, string sessionId, CancellationToken ct) =>
        Ok(await Sender.Send(new GetEducationGuidedLearningSessionQuery(GetUserIdOrThrow(), sessionId, classroomId), ct));

    [HttpPost("sessions/{sessionId}/questions/{questionId}/check")]
    [RestrictedLearner(RestrictedLearnerAccess.Conditional)]
    public async Task<IActionResult> Check(string classroomId, string sessionId, string questionId,
        [FromBody] EducationGuidedLearningCheckRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new CheckEducationGuidedLearningAnswerCommand(
            GetUserIdOrThrow(), sessionId, questionId, request, classroomId), ct));
}
