using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Features.Milestones.DTOs;
using MemoPal.Application.Features.Milestones.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
public sealed class MilestonesController : ApiControllerBase
{
    public MilestonesController(ISender sender) : base(sender)
    {
    }

    [HttpGet("/milestones")]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetMilestonesQuery(GetUserIdOrThrow()), cancellationToken);
        return Ok(data);
    }

    [HttpGet("/milestones/{milestoneId}")]
    public async Task<IActionResult> GetById(string milestoneId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetMilestoneQuery(GetUserIdOrThrow(), milestoneId), cancellationToken);
        return Ok(result);
    }

}


