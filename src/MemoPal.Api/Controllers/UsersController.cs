using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Features.Users.Commands;
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

    [HttpPatch("/users/stats")]
    public async Task<IActionResult> UpdateStats([FromBody] UpdateUserStatsRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpdateUserStatsCommand(GetUserIdOrThrow(), request), cancellationToken); 
        return Ok(result);
    }

    [HttpGet("/users/level")]
    public async Task<IActionResult> GetLevel(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetUserLevelQuery(GetUserIdOrThrow()), cancellationToken); 
        return Ok(result);
    }

    [HttpGet("/stats/updated")]
    public async Task<IActionResult>> GetUpdated([FromQuery] DateTime since, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetUpdatedUserStatsQuery(GetUserIdOrThrow(), since), cancellationToken);
        return Ok(data);
    }
}


