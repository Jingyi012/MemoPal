using MediatR;
using MemoPal.Application.Features.PalaceAssociations.Commands;
using MemoPal.Application.Features.PalaceAssociations.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
[Route("v2/palace-associations")]
public sealed class PalaceAssociationsController(ISender sender) : ApiControllerBase(sender)
{
    [HttpPost("generate")]
    public async Task<IActionResult> Generate(
        [FromBody] GeneratePalaceAssociationsRequest request,
        CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new GeneratePalaceAssociationsCommand(GetUserIdOrThrow(), request),
            cancellationToken);
        return Ok(result);
    }
}
