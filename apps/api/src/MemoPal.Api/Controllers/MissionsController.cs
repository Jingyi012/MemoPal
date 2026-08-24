using MediatR;
using MemoPal.Application.Features.Missions.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
public sealed class MissionsController : ApiControllerBase
{
    public MissionsController(ISender sender) : base(sender)
    {
    }

    [HttpGet("/missions/current")]
    public async Task<IActionResult> GetCurrent(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetUserMissionDashboardQuery(GetUserIdOrThrow()), cancellationToken);
        return Ok(result);
    }

}
