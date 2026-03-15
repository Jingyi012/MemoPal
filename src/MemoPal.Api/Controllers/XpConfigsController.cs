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
    public async Task<IActionResult>> GetAll(CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetXpConfigsQuery(), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<XpConfigDto>>.Ok(data));
    }

    [HttpGet("/xp-configs/{sourceType}")]
    public async Task<IActionResult> GetBySourceType(string sourceType, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetXpConfigBySourceTypeQuery(sourceType), cancellationToken);`n        return Ok(result);
    }

    [HttpPost("/xp-configs")]
    public async Task<IActionResult> Create([FromBody] XpConfigUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new CreateXpConfigCommand(request), cancellationToken);`n        return Ok(result);
    }

    [HttpPatch("/xp-configs/{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] XpConfigUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpdateXpConfigCommand(id, request), cancellationToken);`n        return Ok(result);
    }

    [HttpDelete("/xp-configs/{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken)
    {
        await Sender.Send(new DeleteXpConfigCommand(id), cancellationToken);
        return Ok(ApiResponse<object?>.Ok(null));
    }

    [HttpGet("/xp-configs/updated")]
    public async Task<IActionResult>> GetUpdated([FromQuery] DateTime since, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetUpdatedXpConfigsQuery(since), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<XpConfigDto>>.Ok(data));
    }
}


