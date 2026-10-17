using MediatR;
using MemoPal.Api.Controllers;
using MemoPal.Application.Features.Companion.Commands;
using MemoPal.Application.Features.Companion.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
[Route("companion")]
public sealed class CompanionController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct) => Ok(await Sender.Send(new GetCompanionQuery(GetUserIdOrThrow()), ct));

    [HttpPut("selection")]
    public async Task<IActionResult> Select([FromBody] SelectCompanionRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new SelectCompanionCommand(GetUserIdOrThrow(), request.AvatarId), ct));

    [HttpPost("greet")]
    public async Task<IActionResult> Greet(CancellationToken ct) => Ok(await Sender.Send(new GreetCompanionCommand(GetUserIdOrThrow()), ct));

    [HttpPut("look")]
    public async Task<IActionResult> SaveLook(
        [FromBody] SaveCompanionLookRequest request,
        CancellationToken ct) => Ok(await Sender.Send(new SaveCompanionLookCommand(GetUserIdOrThrow(), request), ct));

    [HttpGet("presets")]
    public async Task<IActionResult> GetPresets(CancellationToken ct) =>
        Ok(await Sender.Send(new GetCompanionLookPresetsQuery(GetUserIdOrThrow()), ct));

    [HttpPost("presets")]
    public async Task<IActionResult> CreatePreset([FromBody] CreateCompanionLookPresetRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new CreateCompanionLookPresetCommand(GetUserIdOrThrow(), request), ct));

    [HttpPut("presets/{id}/equip")]
    public async Task<IActionResult> EquipPreset(string id, CancellationToken ct) =>
        Ok(await Sender.Send(new EquipCompanionLookPresetCommand(GetUserIdOrThrow(), id), ct));

    [HttpDelete("presets/{id}")]
    public async Task<IActionResult> DeletePreset(string id, CancellationToken ct) =>
        Ok(await Sender.Send(new DeleteCompanionLookPresetCommand(GetUserIdOrThrow(), id), ct));
}

public sealed record SelectCompanionRequest(string AvatarId);
