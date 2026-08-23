using MediatR;
using MemoPal.Application.Features.XpEvents.Commands;
using MemoPal.Application.Features.XpEvents.DTOs;
using MemoPal.Application.Features.XpEvents.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
public sealed class XpEventsController : ApiControllerBase
{
    public XpEventsController(ISender sender) : base(sender)
    {
    }

    [HttpGet("/xp-events")]
    public async Task<IActionResult> GetAll([FromQuery] int? recentDays, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetXpEventsQuery(GetUserIdOrThrow(), recentDays), cancellationToken);
        return Ok(result);
    }

    [HttpPost("/xp-events")]
    public async Task<IActionResult> Create([FromBody] XpEventUpsertRequest? request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new CreateXpEventCommand(GetUserIdOrThrow(), request ?? new XpEventUpsertRequest()), cancellationToken);
        return Ok(result);
    }
}
