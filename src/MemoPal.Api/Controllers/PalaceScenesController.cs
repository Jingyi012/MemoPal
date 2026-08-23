using MediatR;
using MemoPal.Application.Features.PalaceScenes.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
[Route("v2/palace-scenes")]
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
}
