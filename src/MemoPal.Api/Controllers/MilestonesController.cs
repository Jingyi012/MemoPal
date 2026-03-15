using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Features.Milestones.Commands;
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
    public async Task<ActionResult<ApiResponse<IReadOnlyList<MilestoneDto>>>> GetAll(CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetMilestonesQuery(GetUserIdOrThrow()), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<MilestoneDto>>.Ok(data));
    }

    [HttpGet("/milestones/{milestoneId}")]
    public async Task<ActionResult<ApiResponse<MilestoneDto>>> GetById(string milestoneId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetMilestoneQuery(GetUserIdOrThrow(), milestoneId), cancellationToken);`n        return Ok(result);
    }

    [HttpPost("/milestones/{milestoneId}/award")]
    public async Task<ActionResult<ApiResponse<bool>>> Award(string milestoneId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new AwardMilestoneCommand(GetUserIdOrThrow(), milestoneId), cancellationToken);`n        return Ok(result);
    }

    [HttpGet("/milestones/updated")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<MilestoneDto>>>> GetUpdated([FromQuery] DateTime since, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetUpdatedMilestonesQuery(GetUserIdOrThrow(), since), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<MilestoneDto>>.Ok(data));
    }
}

