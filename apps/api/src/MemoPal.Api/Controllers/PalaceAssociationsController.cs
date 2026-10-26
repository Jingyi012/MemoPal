using MemoPal.Api.Security;
using MediatR;
using MemoPal.Application.Features.PalaceAssociations.Commands;
using MemoPal.Application.Features.PalaceAssociations.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
[Route("v1/palace-associations")]
public sealed class PalaceAssociationsController(ISender sender) : ApiControllerBase(sender)
{
    [HttpPost("generate")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
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
