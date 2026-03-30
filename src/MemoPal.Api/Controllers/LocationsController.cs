using MediatR;
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
    public async Task<IActionResult> GetByPalace(
        string palaceId,
        [FromQuery] bool adminCreatedOnly = false,
        CancellationToken cancellationToken = default)
    {
        var data = await Sender.Send(
            new GetLocationsByPalaceQuery(
                GetUserIdOrThrow(),
                palaceId,
                IsAdmin: IsAdmin(),
                AdminCreatedOnly: adminCreatedOnly),
            cancellationToken);
        return Ok(data);
    }

    [HttpGet("/locations/{locationId}")]
    public async Task<IActionResult> GetById(string locationId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetLocationQuery(GetUserIdOrThrow(), locationId, IsAdmin()), cancellationToken);
        return Ok(result);
    }

    [HttpPost("/locations")]
    public async Task<IActionResult> Create([FromBody] LocationUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new CreateLocationCommand(GetUserIdOrThrow(), request, IsAdmin()), cancellationToken);
        return Ok(result);
    }

    [HttpPost("/locations/batch")]
    public async Task<IActionResult> CreateBatch([FromBody] IReadOnlyList<LocationUpsertRequest> requests, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new CreateLocationsBatchCommand(GetUserIdOrThrow(), requests, IsAdmin()),
            cancellationToken);
        return Ok(result);
    }

    [HttpPut("/locations/{locationId}")]
    public async Task<IActionResult> Update(string locationId, [FromBody] LocationUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpdateLocationCommand(GetUserIdOrThrow(), locationId, request, IsAdmin()), cancellationToken);
        return Ok(result);
    }

    [HttpPatch("/locations/batch")]
    public async Task<IActionResult> UpdateBatch([FromBody] IReadOnlyList<LocationUpsertRequest> requests, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new UpdateLocationsBatchCommand(GetUserIdOrThrow(), requests, IsAdmin()),
            cancellationToken);
        return Ok(result);
    }

    [HttpPost("/palaces/{palaceId}/locations/reorder")]
    public async Task<IActionResult> Reorder(string palaceId, [FromBody] LocationReorderRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new ReorderLocationsCommand(GetUserIdOrThrow(), palaceId, request, IsAdmin()), cancellationToken);
        return Ok(result);
    }

    [HttpDelete("/locations/{locationId}")]
    public async Task<IActionResult> Delete(string locationId, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new DeleteLocationCommand(GetUserIdOrThrow(), locationId, IsAdmin()), cancellationToken);
        return Ok(data);
    }

    [HttpPost("/locations/batch/delete")]
    public async Task<IActionResult> DeleteBatch([FromBody] BatchDeleteLocationsRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new DeleteLocationsBatchCommand(GetUserIdOrThrow(), request.Ids, IsAdmin()), cancellationToken);
        return Ok(result);
    }

    public sealed class BatchDeleteLocationsRequest
    {
        public IReadOnlyList<string> Ids { get; set; } = [];
    }
}


