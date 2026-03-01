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
    public async Task<ActionResult<ApiResponse<IReadOnlyList<PalaceDto>>>> GetAll(CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetPalacesQuery(GetUserIdOrThrow()), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<PalaceDto>>.Ok(data));
    }

    [HttpGet("{palaceId}")]
    public async Task<ActionResult<ApiResponse<PalaceDto>>> GetById(string palaceId, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetPalaceQuery(GetUserIdOrThrow(), palaceId), cancellationToken);
        return Ok(ApiResponse<PalaceDto>.Ok(data));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<PalaceDto>>> Create([FromBody] PalaceUpsertRequest request, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new CreatePalaceCommand(GetUserIdOrThrow(), request), cancellationToken);
        return Ok(ApiResponse<PalaceDto>.Ok(data));
    }

    [HttpPut("{palaceId}")]
    public async Task<ActionResult<ApiResponse<PalaceDto>>> Update(string palaceId, [FromBody] PalaceUpsertRequest request, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new UpdatePalaceCommand(GetUserIdOrThrow(), palaceId, request), cancellationToken);
        return Ok(ApiResponse<PalaceDto>.Ok(data));
    }

    [HttpDelete("{palaceId}")]
    public async Task<ActionResult<ApiResponse<object?>>> Delete(string palaceId, CancellationToken cancellationToken)
    {
        await Sender.Send(new DeletePalaceCommand(GetUserIdOrThrow(), palaceId), cancellationToken);
        return Ok(ApiResponse<object?>.Ok(null));
    }

    [HttpPost("{palaceId}/unlock")]
    public async Task<ActionResult<ApiResponse<bool>>> Unlock(string palaceId, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new UnlockPalaceCommand(GetUserIdOrThrow(), palaceId), cancellationToken);
        return Ok(ApiResponse<bool>.Ok(data));
    }

    [HttpGet("updated")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<PalaceDto>>>> GetUpdated([FromQuery] DateTime since, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetUpdatedPalacesQuery(GetUserIdOrThrow(), since), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<PalaceDto>>.Ok(data));
    }
}
