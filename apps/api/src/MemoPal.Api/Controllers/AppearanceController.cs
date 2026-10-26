using MemoPal.Api.Security;
using MediatR;
using MemoPal.Application.Features.Appearance.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
[Route("appearance-items")]
public sealed class AppearanceController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet]
    [RestrictedLearner(RestrictedLearnerAccess.Allow)]
    public async Task<IActionResult> GetItems(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetAppearanceDefinitionsQuery(), cancellationToken);
        return Ok(result);
    }
}
