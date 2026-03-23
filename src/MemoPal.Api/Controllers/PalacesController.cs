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
    public async Task<IActionResult> GetAll(
        [FromQuery] int? pageNumber = null,
        [FromQuery] int? pageSize = null,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetPalacesQuery(GetUserIdOrThrow(), pageNumber, pageSize, IsAdmin()), cancellationToken);
        if (!result.Success || result.Data is null)
        {
            return Ok(result);
        }

        var mapped = MapMediaUrls(result.Data);
        if (result is PaginatedResponse<PalaceDto> paged)
        {
            return Ok(PaginatedResponse<PalaceDto>.Ok(
                mapped,
                paged.Pagination.PageNumber,
                paged.Pagination.PageSize,
                paged.Pagination.TotalCount,
                paged.Message));
        }

        return Ok(ApiResponse<IReadOnlyList<PalaceDto>>.Ok(mapped, result.Message));
    }

    [HttpGet("{palaceId}")]
    public async Task<IActionResult> GetById(string palaceId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetPalaceQuery(GetUserIdOrThrow(), palaceId, IsAdmin()), cancellationToken);
        if (!result.Success || result.Data is null)
        {
            return Ok(result);
        }

        return Ok(ApiResponse<PalaceDto>.Ok(MapMediaUrls(result.Data), result.Message));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PalaceUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new CreatePalaceCommand(GetUserIdOrThrow(), request, IsAdmin()), cancellationToken);
        if (!result.Success || result.Data is null)
        {
            return Ok(result);
        }

        return Ok(ApiResponse<PalaceDto>.Ok(MapMediaUrls(result.Data), result.Message));
    }

    [HttpPut("{palaceId}")]
    public async Task<IActionResult> Update(string palaceId, [FromBody] PalaceUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpdatePalaceCommand(GetUserIdOrThrow(), palaceId, request, IsAdmin()), cancellationToken);
        if (!result.Success || result.Data is null)
        {
            return Ok(result);
        }

        return Ok(ApiResponse<PalaceDto>.Ok(MapMediaUrls(result.Data), result.Message));
    }

    [HttpDelete("{palaceId}")]
    public async Task<IActionResult> Delete(string palaceId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new DeletePalaceCommand(GetUserIdOrThrow(), palaceId, IsAdmin()), cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpPost("{palaceId}/unlock")]
    public async Task<IActionResult> Unlock(string palaceId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UnlockPalaceCommand(GetUserIdOrThrow(), palaceId, IsAdmin()), cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }
}

