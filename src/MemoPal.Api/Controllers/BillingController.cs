using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Features.Subscriptions.Commands;
using MemoPal.Application.Features.Subscriptions.DTOs;
using MemoPal.Application.Features.Subscriptions.Queries;
using MemoPal.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Route("billing")]
public sealed class BillingController : ApiControllerBase
{
    public BillingController(ISender sender) : base(sender)
    {
    }

    [Authorize]
    [HttpGet("entitlement")]
    public async Task<ActionResult<ApiResponse<SubscriptionEntitlementDto>>> GetEntitlement(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetEntitlementQuery(GetUserIdOrThrow()), cancellationToken);`n        return Ok(result);
    }

    [Authorize]
    [HttpPost("subscribe")]
    public async Task<ActionResult<ApiResponse<SubscriptionEntitlementDto>>> Subscribe([FromBody] SubscribeRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new SubscribeCommand(GetUserIdOrThrow(), request), cancellationToken);`n        return Ok(result);
    }

    // For provider webhook relay / admin simulation. In production this should be protected by provider signature verification.
    [Authorize(Roles = UserRoles.Admin)]
    [HttpPost("webhooks/subscription")]
    public async Task<ActionResult<ApiResponse<SubscriptionEntitlementDto>>> HandleWebhook(
        [FromBody] WebhookSubscriptionEventRequest request,
        CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new HandleSubscriptionWebhookCommand(request), cancellationToken);`n        return Ok(result);
    }
}

