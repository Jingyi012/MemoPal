using MemoPal.Api.Security;
using MediatR;
using MemoPal.Application.Features.CommunityMemorySets.Commands;
using MemoPal.Application.Features.CommunityMemorySets.DTOs;
using MemoPal.Application.Features.CommunityMemorySets.Admin.Queries;
using MemoPal.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize(Roles = UserRoles.Admin)]
[Route("admin/community-memory-sets")]
public sealed class AdminCommunityMemorySetsController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await Sender.Send(new GetCommunityMemorySetsQuery(
            search, status, pageNumber, pageSize), cancellationToken));

    [HttpPatch("{memorySetId}/hide")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> Hide(
        string memorySetId,
        [FromBody] HideCommunityMemorySetRequest request,
        CancellationToken cancellationToken) =>
        Ok(await Sender.Send(new ModerateCommunityMemorySetCommand(
            memorySetId, true, request.Reason), cancellationToken));

    [HttpPatch("{memorySetId}/restore")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> Restore(string memorySetId, CancellationToken cancellationToken) =>
        Ok(await Sender.Send(new ModerateCommunityMemorySetCommand(memorySetId, false, null), cancellationToken));

    [HttpPatch("{memorySetId}/featured")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> SetFeatured(
        string memorySetId,
        [FromBody] SetCommunityMemorySetFeaturedRequest request,
        CancellationToken cancellationToken) =>
        Ok(await Sender.Send(new SetCommunityMemorySetFeaturedCommand(memorySetId, request.Featured), cancellationToken));
}

public sealed record SetCommunityMemorySetFeaturedRequest(bool Featured);
