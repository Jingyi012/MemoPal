using MemoPal.Api.Security;
using MediatR;
using MemoPal.Api.Controllers;
using MemoPal.Application.Features.Education.PublicLearning.Commands;
using MemoPal.Application.Features.Education.PublicLearning.DTOs;
using MemoPal.Application.Features.Education.PublicLearning.Queries;
using MemoPal.Application.Features.Education.StudyItems;
using MemoPal.Application.Features.Education.MemoryBridge;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
[Route("v1/education/public")]
public sealed class EducationPublicLearningController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet("courses/{courseId}/objectives")]
    [RestrictedLearner(RestrictedLearnerAccess.Conditional)]
    public async Task<IActionResult> GetCourseObjectives(string courseId, CancellationToken ct) =>
        Ok(await Sender.Send(new GetLearnerCourseObjectivesQuery(GetUserIdOrThrow(), courseId), ct));

    [HttpGet("objectives/{objectiveId}/study-items")]
    [RestrictedLearner(RestrictedLearnerAccess.Conditional)]
    public async Task<IActionResult> GetObjectiveStudyItems(string objectiveId, CancellationToken ct) =>
        Ok(await Sender.Send(new GetLearnerObjectiveStudyItemsQuery(GetUserIdOrThrow(), objectiveId), ct));

    [HttpGet("objectives/{objectiveId}/memory-bridge")]
    [RestrictedLearner(RestrictedLearnerAccess.Conditional)]
    public async Task<IActionResult> GetMemoryBridgeStatus(string objectiveId, CancellationToken ct) =>
        Ok(await Sender.Send(new GetEducationMemoryBridgeStatusQuery(GetUserIdOrThrow(), objectiveId), ct));

    [HttpPost("objectives/{objectiveId}/memory-bridge/derive")]
    [RestrictedLearner(RestrictedLearnerAccess.Conditional)]
    public async Task<IActionResult> DeriveMemorySet(string objectiveId,
        [FromBody] DeriveEducationMemorySetRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new DeriveEducationMemorySetCommand(
            GetUserIdOrThrow(), objectiveId, request.TechniqueKey), ct));

    [HttpPost("objectives/{objectiveId}/memory-bridge/{techniqueKey}/sync")]
    [RestrictedLearner(RestrictedLearnerAccess.Conditional)]
    public async Task<IActionResult> SyncMemorySet(string objectiveId, string techniqueKey, CancellationToken ct) =>
        Ok(await Sender.Send(new SyncEducationMemorySetCommand(GetUserIdOrThrow(), objectiveId, techniqueKey), ct));

    [HttpGet("courses")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetCourses([FromQuery] string? search, CancellationToken ct) =>
        Ok(await Sender.Send(new GetEducationPublicCoursesQuery(GetUserIdOrThrow(), search), ct));

    [HttpGet("saved-courses")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetSavedCourses(CancellationToken ct) =>
        Ok(await Sender.Send(new GetEducationPublicCoursesQuery(GetUserIdOrThrow(), null, SavedOnly: true), ct));

    [HttpGet("courses/{courseId}")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetCourse(string courseId, CancellationToken ct) =>
        Ok(await Sender.Send(new GetEducationPublicCourseQuery(GetUserIdOrThrow(), courseId), ct));

    [HttpPut("courses/{courseId}/saved")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> SaveCourse(string courseId, CancellationToken ct) =>
        Ok(await Sender.Send(new SaveEducationPublicCourseCommand(GetUserIdOrThrow(), courseId), ct));

    [HttpDelete("courses/{courseId}/saved")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> UnsaveCourse(string courseId, CancellationToken ct) =>
        Ok(await Sender.Send(new UnsaveEducationPublicCourseCommand(GetUserIdOrThrow(), courseId), ct));

    [HttpPost("courses/{courseId}/reports")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> ReportCourse(string courseId,
        [FromBody] ReportEducationCourseRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new ReportEducationCourseCommand(GetUserIdOrThrow(), courseId, request), ct));

    [HttpGet("courses/{courseId}/assessments/{assessmentId}/practice")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetPracticeAssessment(string courseId, string assessmentId, CancellationToken ct) =>
        Ok(await Sender.Send(new GetEducationPublicPracticeAssessmentQuery(courseId, assessmentId), ct));

    [HttpGet("practice-history")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetPracticeHistory(CancellationToken ct) =>
        Ok(await Sender.Send(new GetEducationPublicPracticeHistoryQuery(GetUserIdOrThrow()), ct));

    [HttpDelete("practice-history")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> ClearPracticeHistory(CancellationToken ct) =>
        Ok(await Sender.Send(new ClearEducationPublicPracticeHistoryCommand(GetUserIdOrThrow()), ct));

    [HttpPost("courses/{courseId}/practice-check")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> CheckPracticeAnswer(string courseId,
        [FromBody] EducationPublicPracticeAnswerRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new CheckEducationPublicPracticeAnswerCommand(GetUserIdOrThrow(), courseId, request), ct));
}
