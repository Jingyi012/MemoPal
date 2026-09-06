using MediatR;
using MemoPal.Application.Features.PalaceScenes.Queries;
using MemoPal.Application.Features.PalaceScenes.Commands;
using MemoPal.Application.Features.PalaceScenes.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
[Route("v1/palace-scenes")]
public sealed class PalaceScenesController : ApiControllerBase
{
    public PalaceScenesController(ISender sender) : base(sender) { }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetPalaceScenesQuery(GetUserIdOrThrow()), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{palaceSceneId}")]
    public async Task<IActionResult> GetById(string palaceSceneId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new GetPalaceSceneQuery(GetUserIdOrThrow(), palaceSceneId),
            cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateCustom(
        [FromBody] PalaceSceneUpsertRequest request,
        CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new CreateCustomPalaceSceneCommand(GetUserIdOrThrow(), request),
            cancellationToken);
        return Ok(result);
    }

    [HttpPut("{palaceSceneId}")]
    public async Task<IActionResult> UpdateCustom(
        string palaceSceneId,
        [FromBody] PalaceSceneUpsertRequest request,
        CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new UpdateCustomPalaceSceneCommand(GetUserIdOrThrow(), palaceSceneId, request),
            cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{palaceSceneId}")]
    public async Task<IActionResult> DeleteCustom(string palaceSceneId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new DeleteCustomPalaceSceneCommand(GetUserIdOrThrow(), palaceSceneId),
            cancellationToken);
        return Ok(result);
    }
}
