using MemoPal.Api.Security;
using MediatR;
using MemoPal.Application.Features.PredefinedMemoryLessons.Commands;
using MemoPal.Application.Features.PredefinedMemoryLessons.DTOs;
using MemoPal.Application.Features.PredefinedMemoryLessons.Admin.Queries;
using MemoPal.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize(Roles = UserRoles.Admin)]
[Route("admin/predefined-memory-lessons")]
public sealed class AdminPredefinedMemoryLessonsController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
        Ok(await Sender.Send(new GetPredefinedMemoryLessonsQuery(), cancellationToken));

    [HttpPost]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> Create(
        [FromBody] PredefinedMemoryLessonUpsertRequest request,
        CancellationToken cancellationToken) =>
        Ok(await Sender.Send(new CreatePredefinedMemoryLessonCommand(request), cancellationToken));

    [HttpPut("{lessonId}")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> Update(
        string lessonId,
        [FromBody] PredefinedMemoryLessonUpsertRequest request,
        CancellationToken cancellationToken) =>
        Ok(await Sender.Send(new UpdatePredefinedMemoryLessonCommand(lessonId, request), cancellationToken));

    [HttpDelete("{lessonId}")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> Delete(string lessonId, CancellationToken cancellationToken) =>
        Ok(await Sender.Send(new DeletePredefinedMemoryLessonCommand(lessonId), cancellationToken));
}
