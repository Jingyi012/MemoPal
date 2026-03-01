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
    public async Task<ActionResult<ApiResponse<IReadOnlyList<LevelConfigDto>>>> GetAll(CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetLevelConfigsQuery(), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<LevelConfigDto>>.Ok(data));
    }

    [HttpGet("/level-configs/{level:int}")]
    public async Task<ActionResult<ApiResponse<LevelConfigDto>>> GetByLevel(int level, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetLevelConfigQuery(level), cancellationToken);
        return Ok(ApiResponse<LevelConfigDto>.Ok(data));
    }

    [HttpPost("/level-configs")]
    public async Task<ActionResult<ApiResponse<LevelConfigDto>>> Create([FromBody] LevelConfigUpsertRequest request, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new CreateLevelConfigCommand(request), cancellationToken);
        return Ok(ApiResponse<LevelConfigDto>.Ok(data));
    }

    [HttpPut("/level-configs/{level:int}")]
    public async Task<ActionResult<ApiResponse<LevelConfigDto>>> Update(int level, [FromBody] LevelConfigUpsertRequest request, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new UpdateLevelConfigCommand(level, request), cancellationToken);
        return Ok(ApiResponse<LevelConfigDto>.Ok(data));
    }

    [HttpDelete("/level-configs/{level:int}")]
    public async Task<ActionResult<ApiResponse<object?>>> Delete(int level, CancellationToken cancellationToken)
    {
        await Sender.Send(new DeleteLevelConfigCommand(level), cancellationToken);
        return Ok(ApiResponse<object?>.Ok(null));
    }

    [HttpGet("/level-configs/updated")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<LevelConfigDto>>>> GetUpdated([FromQuery] DateTime since, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetUpdatedLevelConfigsQuery(since), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<LevelConfigDto>>.Ok(data));
    }
}
