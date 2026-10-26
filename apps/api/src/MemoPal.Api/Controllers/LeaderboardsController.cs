using MemoPal.Api.Security;
using MediatR;
using MemoPal.Application.Features.Leaderboards.Commands;
using MemoPal.Application.Features.Leaderboards.DTOs;
using MemoPal.Application.Features.Leaderboards.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
[Route("v1/leaderboards")]
public sealed class LeaderboardsController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet("catalog")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetCatalog(CancellationToken cancellationToken) =>
        Ok(await Sender.Send(new GetPublicLeaderboardCatalogQuery(), cancellationToken));

    [HttpGet("current")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetCurrent(CancellationToken cancellationToken) =>
        Ok(await Sender.Send(new GetCurrentCommunityLeaderboardQuery(GetUserIdOrThrow()), cancellationToken));

    [HttpPut("preference")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> UpdatePreference(
        [FromBody] UpdateLeaderboardPreferenceRequest request,
        CancellationToken cancellationToken) =>
        Ok(await Sender.Send(
            new UpdateLeaderboardPreferenceCommand(GetUserIdOrThrow(), request.OptedIn), cancellationToken));
}
