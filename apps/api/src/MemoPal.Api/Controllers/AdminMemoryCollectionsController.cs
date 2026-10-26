using MemoPal.Api.Security;
using MediatR;
using MemoPal.Application.Features.PredefinedMemoryLessons.Commands;
using MemoPal.Application.Features.PredefinedMemoryLessons.DTOs;
using MemoPal.Application.Features.PredefinedMemoryLessons.Queries;
using MemoPal.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize(Roles = UserRoles.Admin)]
[Route("admin/memory-collections")]
public sealed class AdminMemoryCollectionsController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetAll(CancellationToken ct) =>
        Ok(await Sender.Send(new GetMemoryCollectionsQuery(false), ct));

    [HttpPost]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> Create([FromBody] PredefinedMemoryCollectionRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new SaveMemoryCollectionCommand(null, request), ct));

    [HttpPost("lessons/{lessonId}/move")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> MoveLesson(string lessonId, [FromBody] MoveCollectionLessonRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new MoveCollectionLessonCommand(lessonId, request), ct));

    [HttpDelete("{collectionId}")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> Delete(string collectionId, [FromQuery] int expectedVersion, CancellationToken ct) =>
        Ok(await Sender.Send(new DeleteMemoryCollectionCommand(collectionId, expectedVersion), ct));

    [HttpPut("{collectionId}")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> Update(string collectionId, [FromBody] PredefinedMemoryCollectionRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new SaveMemoryCollectionCommand(collectionId, request), ct));
}
