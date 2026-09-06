using MediatR;
using MemoPal.Application.Features.PalaceScenes.Commands;
using MemoPal.Application.Features.PalaceScenes.DTOs;
using MemoPal.Application.Features.PalaceScenes.Admin.Queries;
using MemoPal.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize(Roles = UserRoles.Admin)]
[Route("admin/palace-scenes")]
public sealed class AdminPalaceScenesController : ApiControllerBase
{
    public AdminPalaceScenesController(ISender sender) : base(sender) { }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
        Ok(await Sender.Send(new GetPalaceScenesQuery(), cancellationToken));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PalaceSceneUpsertRequest request, CancellationToken cancellationToken) =>
        Ok(await Sender.Send(new CreatePalaceSceneCommand(request), cancellationToken));

    [HttpPut("{sceneId}")]
    public async Task<IActionResult> Update(string sceneId, [FromBody] PalaceSceneUpsertRequest request, CancellationToken cancellationToken) =>
        Ok(await Sender.Send(new UpdatePalaceSceneCommand(sceneId, request), cancellationToken));

    [HttpDelete("{sceneId}")]
    public async Task<IActionResult> Delete(string sceneId, CancellationToken cancellationToken) =>
        Ok(await Sender.Send(new DeletePalaceSceneCommand(sceneId), cancellationToken));
}
