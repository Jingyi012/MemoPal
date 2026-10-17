using MediatR;
using MemoPal.Application.Features.Avatars.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
[Route("avatars")]
public sealed class AvatarsController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet]
    public async Task<IActionResult> GetAvatars(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetAvatarsQuery(), cancellationToken);
        return Ok(result);
    }
}
