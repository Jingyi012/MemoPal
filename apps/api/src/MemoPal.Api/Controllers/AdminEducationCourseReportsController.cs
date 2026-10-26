using MemoPal.Api.Security;
using MediatR;
using MemoPal.Api.Controllers;
using MemoPal.Application.Features.Education.Admin.Commands;
using MemoPal.Application.Features.Education.Admin.DTOs;
using MemoPal.Application.Features.Education.Admin.Queries;
using MemoPal.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize(Roles = UserRoles.Admin)]
[Route("admin/education/course-reports")]
public sealed class AdminEducationCourseReportsController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetReports([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string status = "pending", CancellationToken ct = default) =>
        Ok(await Sender.Send(new GetEducationCourseReportsQuery(pageNumber, pageSize, status), ct));

    [HttpPatch("{reportId}/status")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> SetReportStatus(string reportId,
        [FromBody] ModerateEducationCourseReportRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new SetEducationCourseReportStatusCommand(
            GetUserIdOrThrow(), reportId, request.Status, request.Note), ct));

    [HttpPatch("{courseId}/hide")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> Hide(string courseId, [FromBody] ModerateEducationCourseRequest request,
        CancellationToken ct) =>
        Ok(await Sender.Send(new SetEducationCourseModerationCommand(courseId, true, request.Reason), ct));

    [HttpPatch("{courseId}/restore")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> Restore(string courseId, CancellationToken ct) =>
        Ok(await Sender.Send(new SetEducationCourseModerationCommand(courseId, false, null), ct));
}
