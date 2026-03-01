using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Features.Locations.Commands;
using MemoPal.Application.Features.Locations.DTOs;
using MemoPal.Application.Features.Locations.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
public sealed class LocationsController : ApiControllerBase
{
    public LocationsController(ISender sender) : base(sender)
    {
    }

    [HttpGet("/palaces/{palaceId}/locations")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<LocationDto>>>> GetByPalace(string palaceId, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetLocationsByPalaceQuery(GetUserIdOrThrow(), palaceId), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<LocationDto>>.Ok(data));
    }

    [HttpGet("/locations/{locationId}")]
    public async Task<ActionResult<ApiResponse<LocationDto>>> GetById(string locationId, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetLocationQuery(GetUserIdOrThrow(), locationId), cancellationToken);
        return Ok(ApiResponse<LocationDto>.Ok(data));
    }

    [HttpPost("/locations")]
    public async Task<ActionResult<ApiResponse<LocationDto>>> Create([FromBody] LocationUpsertRequest request, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new CreateLocationCommand(GetUserIdOrThrow(), request), cancellationToken);
        return Ok(ApiResponse<LocationDto>.Ok(data));
    }

    [HttpPut("/locations/{locationId}")]
    public async Task<ActionResult<ApiResponse<LocationDto>>> Update(string locationId, [FromBody] LocationUpsertRequest request, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new UpdateLocationCommand(GetUserIdOrThrow(), locationId, request), cancellationToken);
        return Ok(ApiResponse<LocationDto>.Ok(data));
    }

    [HttpDelete("/locations/{locationId}")]
    public async Task<ActionResult<ApiResponse<object?>>> Delete(string locationId, CancellationToken cancellationToken)
    {
        await Sender.Send(new DeleteLocationCommand(GetUserIdOrThrow(), locationId), cancellationToken);
        return Ok(ApiResponse<object?>.Ok(null));
    }

    [HttpGet("/locations/updated")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<LocationDto>>>> GetUpdated([FromQuery] DateTime since, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetUpdatedLocationsQuery(GetUserIdOrThrow(), since), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<LocationDto>>.Ok(data));
    }
}
