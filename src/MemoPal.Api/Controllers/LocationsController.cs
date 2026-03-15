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
    public async Task<IActionResult>> GetByPalace(string palaceId, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetLocationsByPalaceQuery(GetUserIdOrThrow(), palaceId), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<LocationDto>>.Ok(data));
    }

    [HttpGet("/locations/{locationId}")]
    public async Task<IActionResult> GetById(string locationId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetLocationQuery(GetUserIdOrThrow(), locationId), cancellationToken);`n        return Ok(result);
    }

    [HttpPost("/locations")]
    public async Task<IActionResult> Create([FromBody] LocationUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new CreateLocationCommand(GetUserIdOrThrow(), request), cancellationToken);`n        return Ok(result);
    }

    [HttpPut("/locations/{locationId}")]
    public async Task<IActionResult> Update(string locationId, [FromBody] LocationUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpdateLocationCommand(GetUserIdOrThrow(), locationId, request), cancellationToken);`n        return Ok(result);
    }

    [HttpDelete("/locations/{locationId}")]
    public async Task<IActionResult> Delete(string locationId, CancellationToken cancellationToken)
    {
        await Sender.Send(new DeleteLocationCommand(GetUserIdOrThrow(), locationId), cancellationToken);
        return Ok(ApiResponse<object?>.Ok(null));
    }

    [HttpGet("/locations/updated")]
    public async Task<IActionResult>> GetUpdated([FromQuery] DateTime since, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetUpdatedLocationsQuery(GetUserIdOrThrow(), since), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<LocationDto>>.Ok(data));
    }
}


