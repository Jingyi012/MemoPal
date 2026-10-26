using MemoPal.Api.Security;
using MediatR;
using MemoPal.Application.Features.Leaderboards.Commands;
using MemoPal.Application.Features.Leaderboards.DTOs;
using MemoPal.Application.Features.Leaderboards.Queries;
using MemoPal.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize(Roles = UserRoles.Admin)]
[Route("admin/leaderboards")]
public sealed class AdminLeaderboardsController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet("config")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetConfig(CancellationToken cancellationToken) =>
        Ok(await Sender.Send(new GetAdminLeaderboardCatalogQuery(), cancellationToken));

    [HttpPut("config")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> UpdateConfig(
        [FromBody] UpdateLeaderboardCatalogRequest request,
        CancellationToken cancellationToken)
    {
        var response = await Sender.Send(new UpdateLeaderboardCatalogCommand(request.Config), cancellationToken);
        return response.Success ? Ok(response) : BadRequest(response);
    }
}
