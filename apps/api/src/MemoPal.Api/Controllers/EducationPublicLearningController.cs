using MediatR;
using MemoPal.Api.Controllers;
using MemoPal.Application.Features.Education.PublicLearning.Commands;
using MemoPal.Application.Features.Education.PublicLearning.DTOs;
using MemoPal.Application.Features.Education.PublicLearning.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
[Route("v1/education/public")]
public sealed class EducationPublicLearningController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet("courses")]
    public async Task<IActionResult> GetCourses([FromQuery] string? search, CancellationToken ct) =>
        Ok(await Sender.Send(new GetEducationPublicCoursesQuery(GetUserIdOrThrow(), search), ct));

    [HttpGet("saved-courses")]
    public async Task<IActionResult> GetSavedCourses(CancellationToken ct) =>
        Ok(await Sender.Send(new GetEducationPublicCoursesQuery(GetUserIdOrThrow(), null, SavedOnly: true), ct));

    [HttpGet("courses/{courseId}")]
    public async Task<IActionResult> GetCourse(string courseId, CancellationToken ct) =>
        Ok(await Sender.Send(new GetEducationPublicCourseQuery(GetUserIdOrThrow(), courseId), ct));

    [HttpPut("courses/{courseId}/saved")]
    public async Task<IActionResult> SaveCourse(string courseId, CancellationToken ct) =>
        Ok(await Sender.Send(new SaveEducationPublicCourseCommand(GetUserIdOrThrow(), courseId), ct));

    [HttpDelete("courses/{courseId}/saved")]
    public async Task<IActionResult> UnsaveCourse(string courseId, CancellationToken ct) =>
        Ok(await Sender.Send(new UnsaveEducationPublicCourseCommand(GetUserIdOrThrow(), courseId), ct));

    [HttpPost("courses/{courseId}/reports")]
    public async Task<IActionResult> ReportCourse(string courseId,
        [FromBody] ReportEducationCourseRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new ReportEducationCourseCommand(GetUserIdOrThrow(), courseId, request), ct));

    [HttpGet("courses/{courseId}/assessments/{assessmentId}/practice")]
    public async Task<IActionResult> GetPracticeAssessment(string courseId, string assessmentId, CancellationToken ct) =>
        Ok(await Sender.Send(new GetEducationPublicPracticeAssessmentQuery(courseId, assessmentId), ct));

    [HttpGet("practice-history")]
    public async Task<IActionResult> GetPracticeHistory(CancellationToken ct) =>
        Ok(await Sender.Send(new GetEducationPublicPracticeHistoryQuery(GetUserIdOrThrow()), ct));

    [HttpDelete("practice-history")]
    public async Task<IActionResult> ClearPracticeHistory(CancellationToken ct) =>
        Ok(await Sender.Send(new ClearEducationPublicPracticeHistoryCommand(GetUserIdOrThrow()), ct));

    [HttpPost("courses/{courseId}/practice-check")]
    public async Task<IActionResult> CheckPracticeAnswer(string courseId,
        [FromBody] EducationPublicPracticeAnswerRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new CheckEducationPublicPracticeAnswerCommand(GetUserIdOrThrow(), courseId, request), ct));
}
