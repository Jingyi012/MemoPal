using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Features.Palaces.Commands;
using MemoPal.Application.Features.Palaces.DTOs;
using MemoPal.Application.Features.Palaces.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
[Route("palaces")]
public sealed class PalacesController : ApiControllerBase
{
    public PalacesController(ISender sender) : base(sender)
    {
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<PalaceDto>>> GetAll(
        [FromQuery] bool paginate = false,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetPalacesQuery(GetUserIdOrThrow(), paginate, pageNumber, pageSize), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{palaceId}")]
    public async Task<ActionResult<ApiResponse<PalaceDto>>> GetById(string palaceId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetPalaceQuery(GetUserIdOrThrow(), palaceId), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<PalaceDto>>> Create([FromBody] PalaceUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new CreatePalaceCommand(GetUserIdOrThrow(), request), cancellationToken);
        return Ok(result);
    }

    [HttpPut("{palaceId}")]
    public async Task<ActionResult<ApiResponse<PalaceDto>>> Update(string palaceId, [FromBody] PalaceUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpdatePalaceCommand(GetUserIdOrThrow(), palaceId, request), cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{palaceId}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(string palaceId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new DeletePalaceCommand(GetUserIdOrThrow(), palaceId), cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpPost("{palaceId}/unlock")]
    public async Task<ActionResult<ApiResponse<bool>>> Unlock(string palaceId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UnlockPalaceCommand(GetUserIdOrThrow(), palaceId), cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpGet("updated")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<PalaceDto>>>> GetUpdated([FromQuery] DateTime since, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetUpdatedPalacesQuery(GetUserIdOrThrow(), since), cancellationToken);
        return Ok(result);
    }
}
