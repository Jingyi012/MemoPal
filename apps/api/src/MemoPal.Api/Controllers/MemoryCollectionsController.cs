using MemoPal.Api.Security;
using MediatR;
using MemoPal.Application.Features.PredefinedMemoryLessons.Commands;
using MemoPal.Application.Features.PredefinedMemoryLessons.DTOs;
using MemoPal.Application.Features.PredefinedMemoryLessons.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
[Route("v1/memory-collections")]
public sealed class MemoryCollectionsController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetAll(CancellationToken ct) =>
        Ok(await Sender.Send(new GetMemoryCollectionsQuery(true), ct));

    [HttpPost("{collectionId}/download")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> Download(string collectionId, [FromBody] DownloadMemoryCollectionRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new DownloadMemoryCollectionCommand(GetUserIdOrThrow(), collectionId, request.Language), ct));
}
