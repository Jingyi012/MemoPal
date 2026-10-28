using MemoPal.Api.Security;
using MediatR;
using MemoPal.Application.Features.Education.GuidedLearning.Commands;
using MemoPal.Application.Features.Education.GuidedLearning.DTOs;
using MemoPal.Application.Features.Education.GuidedLearning.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
[Route("v1/education/guided")]
public sealed class EducationGuidedLearningController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet("courses/home-progress")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetHomeProgress(CancellationToken ct) =>
        Ok(await Sender.Send(new GetEducationGuidedHomeProgressQuery(GetUserIdOrThrow()), ct));

    [HttpGet("courses/{courseId}/progress")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetCourseProgress(string courseId, CancellationToken ct) =>
        Ok(await Sender.Send(new GetEducationGuidedCourseProgressQuery(GetUserIdOrThrow(), courseId), ct));

    [HttpPost("courses/{courseId}/assessments/{assessmentId}/sessions")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> StartOrResume(string courseId, string assessmentId, CancellationToken ct) =>
        Ok(await Sender.Send(new StartOrResumeEducationGuidedLearningSessionCommand(
            GetUserIdOrThrow(), courseId, assessmentId), ct));

    [HttpGet("sessions/{sessionId}")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetSession(string sessionId, CancellationToken ct) =>
        Ok(await Sender.Send(new GetEducationGuidedLearningSessionQuery(GetUserIdOrThrow(), sessionId), ct));

    [HttpPost("sessions/{sessionId}/questions/{questionId}/check")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> Check(string sessionId, string questionId,
        [FromBody] EducationGuidedLearningCheckRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new CheckEducationGuidedLearningAnswerCommand(
            GetUserIdOrThrow(), sessionId, questionId, request), ct));
}
