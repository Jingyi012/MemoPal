using MemoPal.Api.Security;
using MediatR;
using MemoPal.Application.Features.Avatars.Commands;
using MemoPal.Application.Features.Avatars.DTOs;
using MemoPal.Application.Features.Avatars.Queries;
using MemoPal.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize(Roles = UserRoles.Admin)]
[Route("admin/avatars")]
public sealed class AdminAvatarsController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetAvatars(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetPagedAvatarDefinitionsQuery(pageNumber, pageSize, search), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> Create([FromBody] AvatarDefinitionUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new CreateAvatarDefinitionCommand(request), cancellationToken);
        return Ok(result);
    }

    [HttpPut("{avatarId}")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> Update(string avatarId, [FromBody] AvatarDefinitionUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpdateAvatarDefinitionCommand(avatarId, request), cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{avatarId}")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> Delete(string avatarId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new DeleteAvatarDefinitionCommand(avatarId), cancellationToken);
        return Ok(result);
    }
}
