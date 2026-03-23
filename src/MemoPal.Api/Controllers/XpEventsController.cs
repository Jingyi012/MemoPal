using MediatR;
using MemoPal.Application.Features.XpEvents.Commands;
using MemoPal.Application.Features.XpEvents.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
public sealed class XpEventsController : ApiControllerBase
{
    public XpEventsController(ISender sender) : base(sender)
    {
    }

    [HttpPost("/xp-events")]
    public async Task<IActionResult> Create([FromBody] XpEventUpsertRequest? request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new CreateXpEventCommand(GetUserIdOrThrow(), request ?? new XpEventUpsertRequest()), cancellationToken);
        return Ok(result);
    }
}
