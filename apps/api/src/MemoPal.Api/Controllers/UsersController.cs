using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Features.Users.DTOs;
using MemoPal.Application.Features.Users.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
public sealed class UsersController : ApiControllerBase
{
    public UsersController(ISender sender) : base(sender)
    {
    }

    [HttpGet("/users/stats")]
    public async Task<IActionResult> GetStats(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetUserStatsQuery(GetUserIdOrThrow()), cancellationToken); 
        return Ok(result);
    }

    [HttpGet("/users/level")]
    public async Task<IActionResult> GetLevel(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetUserLevelQuery(GetUserIdOrThrow()), cancellationToken); 
        return Ok(result);
    }

    [HttpGet("/users/feature-limits")]
    public async Task<IActionResult> GetFeatureLimits(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetFeatureLimitsQuery(GetUserIdOrThrow()), cancellationToken);
        return Ok(result);
    }

}


