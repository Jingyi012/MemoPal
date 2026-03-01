using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Features.Configs.Commands;
using MemoPal.Application.Features.Configs.DTOs;
using MemoPal.Application.Features.Configs.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
public sealed class XpConfigsController : ApiControllerBase
{
    public XpConfigsController(ISender sender) : base(sender)
    {
    }

    [HttpGet("/xp-configs")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<XpConfigDto>>>> GetAll(CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetXpConfigsQuery(), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<XpConfigDto>>.Ok(data));
    }

    [HttpGet("/xp-configs/{sourceType}")]
    public async Task<ActionResult<ApiResponse<XpConfigDto>>> GetBySourceType(string sourceType, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetXpConfigBySourceTypeQuery(sourceType), cancellationToken);
        return Ok(ApiResponse<XpConfigDto>.Ok(data));
    }

    [HttpPost("/xp-configs")]
    public async Task<ActionResult<ApiResponse<XpConfigDto>>> Create([FromBody] XpConfigUpsertRequest request, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new CreateXpConfigCommand(request), cancellationToken);
        return Ok(ApiResponse<XpConfigDto>.Ok(data));
    }

    [HttpPatch("/xp-configs/{id}")]
    public async Task<ActionResult<ApiResponse<XpConfigDto>>> Update(string id, [FromBody] XpConfigUpsertRequest request, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new UpdateXpConfigCommand(id, request), cancellationToken);
        return Ok(ApiResponse<XpConfigDto>.Ok(data));
    }

    [HttpDelete("/xp-configs/{id}")]
    public async Task<ActionResult<ApiResponse<object?>>> Delete(string id, CancellationToken cancellationToken)
    {
        await Sender.Send(new DeleteXpConfigCommand(id), cancellationToken);
        return Ok(ApiResponse<object?>.Ok(null));
    }

    [HttpGet("/xp-configs/updated")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<XpConfigDto>>>> GetUpdated([FromQuery] DateTime since, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetUpdatedXpConfigsQuery(since), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<XpConfigDto>>.Ok(data));
    }
}
