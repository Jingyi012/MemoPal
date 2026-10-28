using MemoPal.Api.Security;
using MediatR;
using MemoPal.Api.Controllers;
using MemoPal.Application.Features.Education.Authoring;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using MemoPal.Application.Features.Education.StudyItems;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
[Route("v1/education")]
public sealed class EducationAuthoringController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet("courses")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetCourses(CancellationToken ct) => Ok(await Sender.Send(new GetCoursesQuery(GetUserIdOrThrow(), IsAdmin()), ct));

    [HttpPost("courses")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> CreateCourse([FromBody] CreateCourseRequest request, CancellationToken ct) => Ok(await Sender.Send(new CreateCourseCommand(GetUserIdOrThrow(), request), ct));

    [HttpPut("courses/{courseId}/title")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> UpdateCourseTitle(string courseId, [FromBody] UpdateEducationCourseTitleRequest request,
        CancellationToken ct) => Ok(await Sender.Send(new UpdateEducationCourseTitleCommand(
            GetUserIdOrThrow(), courseId, request.Title, IsAdmin()), ct));

    [HttpGet("courses/{courseId}/classrooms")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetCourseClassrooms(string courseId, CancellationToken ct) =>
        Ok(await Sender.Send(new GetEducationCourseClassroomsQuery(GetUserIdOrThrow(), courseId, IsAdmin()), ct));

    [HttpGet("courses/{courseId}/objectives")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetObjectives(string courseId, CancellationToken ct) => Ok(await Sender.Send(new GetObjectivesQuery(GetUserIdOrThrow(), courseId, IsAdmin()), ct));

    [HttpPut("courses/{courseId}/objectives/{objectiveId}/study-metadata")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> UpdateObjectiveStudyMetadata(string courseId, string objectiveId,
        [FromBody] UpdateEducationObjectiveStudyMetadataRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new UpdateObjectiveStudyMetadataCommand(GetUserIdOrThrow(), courseId, objectiveId, request, IsAdmin()), ct));

    [HttpGet("courses/{courseId}/objectives/{objectiveId}/study-items")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetObjectiveStudyItems(string courseId, string objectiveId, CancellationToken ct) =>
        Ok(await Sender.Send(new GetAuthorStudyItemsQuery(GetUserIdOrThrow(), courseId, objectiveId) { IsAdmin = IsAdmin() }, ct));

    [HttpPost("courses/{courseId}/objectives/{objectiveId}/study-items")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> CreateObjectiveStudyItem(string courseId, string objectiveId,
        [FromBody] EducationObjectiveStudyItemRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new CreateObjectiveStudyItemCommand(GetUserIdOrThrow(), courseId, objectiveId, request, IsAdmin()), ct));

    [HttpPost("courses/{courseId}/objectives/{objectiveId}/study-items/batch")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> ImportObjectiveStudyItems(string courseId, string objectiveId,
        [FromBody] IReadOnlyList<EducationObjectiveStudyItemRequest> items, CancellationToken ct) =>
        Ok(await Sender.Send(new ImportObjectiveStudyItemsCommand(GetUserIdOrThrow(), courseId, objectiveId, items, IsAdmin: IsAdmin()), ct));

    [HttpPost("courses/{courseId}/objectives/{objectiveId}/study-items/import/json")]
    [RequestSizeLimit(2_097_152)]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> ImportObjectiveStudyItemsJson(string courseId, string objectiveId,
        [FromBody] IReadOnlyList<EducationObjectiveStudyItemRequest> items, [FromQuery] bool dryRun = false, CancellationToken ct = default)
    {
        return Ok(await Sender.Send(new ImportObjectiveStudyItemsCommand(GetUserIdOrThrow(), courseId, objectiveId, items,
            Enumerable.Range(2, items?.Count ?? 0).ToArray(), dryRun, Request.ContentLength, IsAdmin()), ct));
    }

    [HttpPost("courses/{courseId}/objectives/{objectiveId}/study-items/import/csv")]
    [Consumes("text/csv", "application/octet-stream")]
    [RequestSizeLimit(2_097_152)]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> ImportObjectiveStudyItemsCsv(string courseId, string objectiveId,
        [FromQuery] bool dryRun = false, CancellationToken ct = default)
    {
        await using var buffer = new MemoryStream();
        await Request.Body.CopyToAsync(buffer, ct);
        return Ok(await Sender.Send(new ImportObjectiveStudyItemsCsvCommand(GetUserIdOrThrow(), courseId, objectiveId, buffer.ToArray())
        { DryRun = dryRun, IsAdmin = IsAdmin() }, ct));
    }

    [HttpPut("courses/{courseId}/objectives/{objectiveId}/study-items/{itemId}")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> UpdateObjectiveStudyItem(string courseId, string objectiveId, string itemId,
        [FromBody] EducationObjectiveStudyItemRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new UpdateObjectiveStudyItemCommand(GetUserIdOrThrow(), courseId, objectiveId, itemId, request, IsAdmin()), ct));

    [HttpDelete("courses/{courseId}/objectives/{objectiveId}/study-items/{itemId}")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> DeleteObjectiveStudyItem(string courseId, string objectiveId, string itemId, CancellationToken ct) =>
        Ok(await Sender.Send(new DeleteObjectiveStudyItemCommand(GetUserIdOrThrow(), courseId, objectiveId, itemId, IsAdmin()), ct));

    [HttpPut("courses/{courseId}/objectives/{objectiveId}/study-items/reorder")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> ReorderObjectiveStudyItems(string courseId, string objectiveId,
        [FromBody] ReorderEducationStudyItemsRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new ReorderObjectiveStudyItemsCommand(GetUserIdOrThrow(), courseId, objectiveId, request.ItemIds, IsAdmin()), ct));

    [HttpPost("courses/{courseId}/objectives/{objectiveId}/study-items/{itemId}/publish")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> PublishObjectiveStudyItem(string courseId, string objectiveId, string itemId,
        [FromBody] PublishEducationStudyItemRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new SetObjectiveStudyItemPublicationCommand(GetUserIdOrThrow(), courseId, objectiveId,
            itemId, true, request.NotConfidentialExamContent, IsAdmin()), ct));

    [HttpPost("courses/{courseId}/objectives/{objectiveId}/study-items/{itemId}/retract")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> RetractObjectiveStudyItem(string courseId, string objectiveId, string itemId, CancellationToken ct) =>
        Ok(await Sender.Send(new SetObjectiveStudyItemPublicationCommand(GetUserIdOrThrow(), courseId, objectiveId,
            itemId, false, false, IsAdmin()), ct));

    [HttpPost("courses/{courseId}/objectives")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> CreateObjective(string courseId, [FromBody] CreateObjectiveRequest request, CancellationToken ct) => Ok(await Sender.Send(new CreateObjectiveCommand(GetUserIdOrThrow(), courseId, request, IsAdmin()), ct));

    [HttpPut("courses/{courseId}/objectives/{objectiveId}/memory-recommendation")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> SetObjectiveMemoryRecommendation(string courseId, string objectiveId,
        [FromBody] SetEducationObjectiveMemoryRecommendationRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new SetEducationObjectiveMemoryRecommendationCommand(
            GetUserIdOrThrow(), courseId, objectiveId, request.RecommendedMemorySetId, IsAdmin()), ct));

    [HttpPut("courses/{courseId}/visibility")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> SetCourseVisibility(string courseId, [FromBody] SetEducationCourseVisibilityRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new SetEducationCourseVisibilityCommand(GetUserIdOrThrow(), courseId, request.IsPublic, request.NotConfidentialExamContent, IsAdmin()), ct));

    [HttpGet("courses/{courseId}/assessments")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetAssessments(string courseId, CancellationToken ct) => Ok(await Sender.Send(new GetAssessmentsQuery(GetUserIdOrThrow(), courseId, IsAdmin()), ct));

    [HttpPost("courses/{courseId}/assessments")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> CreateAssessment(string courseId, [FromBody] CreateAssessmentRequest request, CancellationToken ct) => Ok(await Sender.Send(new CreateAssessmentCommand(GetUserIdOrThrow(), courseId, request, IsAdmin()), ct));

    [HttpGet("assessments/{id}")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetAssessment(string id, CancellationToken ct) => Ok(await Sender.Send(new GetAssessmentQuery(GetUserIdOrThrow(), id, IsAdmin()), ct));

    [HttpPut("assessments/{id}")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> UpdateAssessment(string id, [FromBody] UpdateAssessmentRequest request, CancellationToken ct) => Ok(await Sender.Send(new UpdateAssessmentCommand(GetUserIdOrThrow(), id, request, IsAdmin()), ct));

    [HttpPost("assessments/{id}/publish")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> PublishAssessment(string id, [FromBody] PublishAssessmentRequest request, CancellationToken ct) => Ok(await Sender.Send(new PublishAssessmentCommand(GetUserIdOrThrow(), id, request.ExpectedVersion, request.IsPublicPractice, IsAdmin()), ct));

    [HttpPost("assessments/{id}/revision-draft")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> CreateAssessmentRevisionDraft(string id, [FromBody] CreateAssessmentRevisionDraftRequest request,
        CancellationToken ct) => Ok(await Sender.Send(new CreateAssessmentRevisionDraftCommand(
            GetUserIdOrThrow(), id, request.ExpectedVersion, IsAdmin()), ct));

    [HttpPut("assessments/{id}/public-practice")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> SetAssessmentPublicPractice(string id, [FromBody] SetAssessmentPublicPracticeRequest request,
        CancellationToken ct) => Ok(await Sender.Send(new SetAssessmentPublicPracticeCommand(
            GetUserIdOrThrow(), id, request.IsPublicPractice, request.NotConfidentialExamContent, IsAdmin()), ct));
}

public sealed record PublishAssessmentRequest(int ExpectedVersion, bool IsPublicPractice = false);
public sealed record UpdateEducationCourseTitleRequest(string Title);
