using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Features.Configs.Commands;
using MemoPal.Application.Features.Configs.DTOs;
using MemoPal.Application.Features.Configs.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
public sealed class LevelConfigsController : ApiControllerBase
{
    public LevelConfigsController(ISender sender) : base(sender)
    {
    }

    [HttpGet("/level-configs")]
    public async Task<IActionResult>> GetAll(CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetLevelConfigsQuery(), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<LevelConfigDto>>.Ok(data));
    }

    [HttpGet("/level-configs/{level:int}")]
    public async Task<IActionResult> GetByLevel(int level, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetLevelConfigQuery(level), cancellationToken);`n        return Ok(result);
    }

    [HttpPost("/level-configs")]
    public async Task<IActionResult> Create([FromBody] LevelConfigUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new CreateLevelConfigCommand(request), cancellationToken);`n        return Ok(result);
    }

    [HttpPut("/level-configs/{level:int}")]
    public async Task<IActionResult> Update(int level, [FromBody] LevelConfigUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpdateLevelConfigCommand(level, request), cancellationToken);`n        return Ok(result);
    }

    [HttpDelete("/level-configs/{level:int}")]
    public async Task<IActionResult> Delete(int level, CancellationToken cancellationToken)
    {
        await Sender.Send(new DeleteLevelConfigCommand(level), cancellationToken);
        return Ok(ApiResponse<object?>.Ok(null));
    }

    [HttpGet("/level-configs/updated")]
    public async Task<IActionResult>> GetUpdated([FromQuery] DateTime since, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetUpdatedLevelConfigsQuery(since), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<LevelConfigDto>>.Ok(data));
    }
}


