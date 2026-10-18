using MediatR;
using MemoPal.Api.Controllers;
using MemoPal.Application.Features.Education.Authoring;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
[Route("v1/education")]
public sealed class EducationAuthoringController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet("courses")]
    public async Task<IActionResult> GetCourses(CancellationToken ct) => Ok(await Sender.Send(new GetCoursesQuery(GetUserIdOrThrow()), ct));

    [HttpPost("courses")]
    public async Task<IActionResult> CreateCourse([FromBody] CreateCourseRequest request, CancellationToken ct) => Ok(await Sender.Send(new CreateCourseCommand(GetUserIdOrThrow(), request), ct));

    [HttpGet("courses/{courseId}/objectives")]
    public async Task<IActionResult> GetObjectives(string courseId, CancellationToken ct) => Ok(await Sender.Send(new GetObjectivesQuery(GetUserIdOrThrow(), courseId), ct));

    [HttpPost("courses/{courseId}/objectives")]
    public async Task<IActionResult> CreateObjective(string courseId, [FromBody] CreateObjectiveRequest request, CancellationToken ct) => Ok(await Sender.Send(new CreateObjectiveCommand(GetUserIdOrThrow(), courseId, request), ct));

    [HttpPut("courses/{courseId}/objectives/{objectiveId}/memory-recommendation")]
    public async Task<IActionResult> SetObjectiveMemoryRecommendation(string courseId, string objectiveId,
        [FromBody] SetEducationObjectiveMemoryRecommendationRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new SetEducationObjectiveMemoryRecommendationCommand(
            GetUserIdOrThrow(), courseId, objectiveId, request.RecommendedMemorySetId), ct));

    [HttpPut("courses/{courseId}/visibility")]
    public async Task<IActionResult> SetCourseVisibility(string courseId, [FromBody] SetEducationCourseVisibilityRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new SetEducationCourseVisibilityCommand(GetUserIdOrThrow(), courseId, request.IsPublic), ct));

    [HttpGet("courses/{courseId}/assessments")]
    public async Task<IActionResult> GetAssessments(string courseId, CancellationToken ct) => Ok(await Sender.Send(new GetAssessmentsQuery(GetUserIdOrThrow(), courseId), ct));

    [HttpPost("courses/{courseId}/assessments")]
    public async Task<IActionResult> CreateAssessment(string courseId, [FromBody] CreateAssessmentRequest request, CancellationToken ct) => Ok(await Sender.Send(new CreateAssessmentCommand(GetUserIdOrThrow(), courseId, request), ct));

    [HttpGet("assessments/{id}")]
    public async Task<IActionResult> GetAssessment(string id, CancellationToken ct) => Ok(await Sender.Send(new GetAssessmentQuery(GetUserIdOrThrow(), id), ct));

    [HttpPut("assessments/{id}")]
    public async Task<IActionResult> UpdateAssessment(string id, [FromBody] UpdateAssessmentRequest request, CancellationToken ct) => Ok(await Sender.Send(new UpdateAssessmentCommand(GetUserIdOrThrow(), id, request), ct));

    [HttpPost("assessments/{id}/publish")]
    public async Task<IActionResult> PublishAssessment(string id, [FromBody] PublishAssessmentRequest request, CancellationToken ct) => Ok(await Sender.Send(new PublishAssessmentCommand(GetUserIdOrThrow(), id, request.ExpectedVersion, request.IsPublicPractice), ct));
}

public sealed record PublishAssessmentRequest(int ExpectedVersion, bool IsPublicPractice = false);
