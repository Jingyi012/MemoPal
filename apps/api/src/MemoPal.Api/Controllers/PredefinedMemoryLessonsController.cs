using MemoPal.Api.Security;
using MediatR;
using MemoPal.Application.Features.PredefinedMemoryLessons.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
[Route("v1/predefined-memory-lessons")]
public sealed class PredefinedMemoryLessonsController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetPublished([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50, CancellationToken cancellationToken = default) =>
        Ok(await Sender.Send(new GetPagedPublishedPredefinedMemoryLessonsQuery(pageNumber, pageSize), cancellationToken));
}
