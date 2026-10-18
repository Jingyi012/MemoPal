using MediatR;
using MemoPal.Api.Controllers;
using MemoPal.Application.Features.Education.Assignments.Commands;
using MemoPal.Application.Features.Education.Assignments.DTOs;
using MemoPal.Application.Features.Education.Assignments.Queries;
using MemoPal.Application.Features.Education.Progress.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
[Route("v1/education")]
public sealed class EducationAssignmentsController(ISender sender) : ApiControllerBase(sender)
{
    [HttpPost("classrooms/{classroomId}/assignments")]
    public async Task<IActionResult> CreateClassroomAssignment(string classroomId, [FromBody] CreateClassroomAssignmentRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new CreateClassroomAssignmentCommand(GetUserIdOrThrow(), classroomId, request), ct));

    [HttpPost("assignments/family")]
    public async Task<IActionResult> CreateFamilyAssignment([FromBody] CreateFamilyAssignmentRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new CreateFamilyAssignmentCommand(GetUserIdOrThrow(), request), ct));

    [HttpPost("assignments/{assignmentId}/retakes")]
    public async Task<IActionResult> CreateRetake(string assignmentId, [FromBody] CreateEducationRetakeRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new CreateEducationRetakeCommand(GetUserIdOrThrow(), assignmentId, request), ct));

    [HttpGet("family/assignments")]
    public async Task<IActionResult> GetMyFamilyAssignments(CancellationToken ct) =>
        Ok(await Sender.Send(new GetMyFamilyAssignmentsQuery(GetUserIdOrThrow()), ct));

    [HttpGet("classrooms/{classroomId}/assignments")]
    public async Task<IActionResult> GetClassroomAssignments(string classroomId, CancellationToken ct) =>
        Ok(await Sender.Send(new GetClassroomAssignmentsQuery(GetUserIdOrThrow(), classroomId), ct));

    [HttpGet("classrooms/{classroomId}/objectives/progress")]
    public async Task<IActionResult> GetClassroomObjectiveProgress(string classroomId, CancellationToken ct) =>
        Ok(await Sender.Send(new GetClassroomObjectiveProgressQuery(GetUserIdOrThrow(), classroomId), ct));

    [HttpGet("assignments/{assignmentId}")]
    public async Task<IActionResult> GetAssignment(string assignmentId, CancellationToken ct) =>
        Ok(await Sender.Send(new GetEducationAssignmentQuery(GetUserIdOrThrow(), assignmentId), ct));

    [HttpGet("assignments/{assignmentId}/gradebook")]
    public async Task<IActionResult> GetGradebook(string assignmentId, CancellationToken ct) =>
        Ok(await Sender.Send(new GetEducationAssignmentGradebookQuery(GetUserIdOrThrow(), assignmentId), ct));

    [HttpGet("assignments/{assignmentId}/leaderboard")]
    public async Task<IActionResult> GetLeaderboard(string assignmentId, CancellationToken ct) =>
        Ok(await Sender.Send(new GetEducationAssignmentLeaderboardQuery(GetUserIdOrThrow(), assignmentId), ct));

    [HttpPut("assignments/{assignmentId}/leaderboard-preference")]
    public async Task<IActionResult> UpdateLeaderboardPreference(string assignmentId, [FromBody] UpdateEducationLeaderboardPreferenceRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new UpdateEducationLeaderboardPreferenceCommand(GetUserIdOrThrow(), assignmentId, request), ct));

    [HttpPost("assignments/{assignmentId}/publish-results")]
    public async Task<IActionResult> PublishResults(string assignmentId, CancellationToken ct) =>
        Ok(await Sender.Send(new PublishEducationAssignmentResultsCommand(GetUserIdOrThrow(), assignmentId), ct));

    [HttpPost("assignments/{assignmentId}/attempts/{attemptId}/correct-grade")]
    public async Task<IActionResult> CorrectGrade(string assignmentId, string attemptId, [FromBody] CorrectEducationAttemptGradeRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new CorrectEducationAttemptGradeCommand(GetUserIdOrThrow(), assignmentId, attemptId, request), ct));

    [HttpPost("assignments/{assignmentId}/attempts/{attemptId}/responses/{questionId}/grade")]
    public async Task<IActionResult> GradeManualResponse(string assignmentId, string attemptId, string questionId,
        [FromBody] GradeEducationManualResponseRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new GradeEducationManualResponseCommand(GetUserIdOrThrow(), assignmentId, attemptId, questionId, request), ct));

    [HttpGet("my/assignments")]
    public async Task<IActionResult> GetMyAssignments(CancellationToken ct) =>
        Ok(await Sender.Send(new GetMyEducationAssignmentsQuery(GetUserIdOrThrow()), ct));
}
