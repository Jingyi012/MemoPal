using MemoPal.Api.Security;
using MediatR;
using MemoPal.Application.Features.NumberPegStories.Commands;
using MemoPal.Application.Features.NumberPegStories.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;
[Authorize]
[Route("v1/number-peg-stories")]
public sealed class NumberPegStoriesController(ISender sender) : ApiControllerBase(sender)
{
    [HttpPost("generate")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> Generate([FromBody] GenerateNumberPegStoriesRequest request, CancellationToken cancellationToken) => Ok(await Sender.Send(new GenerateNumberPegStoriesCommand(GetUserIdOrThrow(), request), cancellationToken));
}
