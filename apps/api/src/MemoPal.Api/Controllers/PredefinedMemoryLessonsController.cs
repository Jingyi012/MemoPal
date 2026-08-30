using MediatR;
using MemoPal.Application.Features.PredefinedMemoryLessons.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
[Route("predefined-memory-lessons")]
public sealed class PredefinedMemoryLessonsController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet]
    public async Task<IActionResult> GetPublished(CancellationToken cancellationToken) =>
        Ok(await Sender.Send(new GetPublishedPredefinedMemoryLessonsQuery(), cancellationToken));
}
