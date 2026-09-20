using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Features.Subscriptions.Commands;
using MemoPal.Application.Features.Subscriptions.DTOs;
using MemoPal.Application.Features.Subscriptions.Queries;
using MemoPal.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using MemoPal.Api.Options;
using System.Security.Cryptography;
using System.Text;

namespace MemoPal.Api.Controllers;

[Route("billing")]
public sealed class BillingController : ApiControllerBase
{
    private const string WebhookSecretHeaderName = "X-MemoPal-Webhook-Secret";
    private readonly BillingWebhookOptions _webhookOptions;

    public BillingController(ISender sender, IOptions<BillingWebhookOptions> webhookOptions) : base(sender)
    {
        _webhookOptions = webhookOptions.Value;
    }

    [Authorize]
    [HttpGet("entitlement")]
    public async Task<IActionResult> GetEntitlement(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetEntitlementQuery(GetUserIdOrThrow()), cancellationToken); return Ok(result);
    }

    [Authorize]
    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe([FromBody] SubscribeRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new SubscribeCommand(GetUserIdOrThrow(), request), cancellationToken); return Ok(result);
    }

    [Authorize]
    [HttpPost("cancel")]
    public async Task<IActionResult> Cancel(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new CancelSubscriptionCommand(GetUserIdOrThrow()), cancellationToken); return Ok(result);
    }

    // For provider webhook relay / admin simulation. In production this should be protected by provider signature verification.
    [Authorize(Roles = UserRoles.Admin)]
    [HttpPost("webhooks/subscription")]
    public async Task<IActionResult> HandleWebhook(
        [FromBody] WebhookSubscriptionEventRequest request,
        CancellationToken cancellationToken)
    {
        ValidateWebhookSecretIfConfigured();

        var result = await Sender.Send(new HandleSubscriptionWebhookCommand(request), cancellationToken);
        return Ok(result);
    }

    private void ValidateWebhookSecretIfConfigured()
    {
        var expectedSecret = _webhookOptions.Secret?.Trim();
        if (string.IsNullOrWhiteSpace(expectedSecret))
        {
            return;
        }

        if (!Request.Headers.TryGetValue(WebhookSecretHeaderName, out var providedValues))
        {
            throw new UnauthorizedAppException("Invalid webhook secret.");
        }

        var providedSecret = providedValues.ToString().Trim();
        if (string.IsNullOrWhiteSpace(providedSecret) || !SecretMatches(providedSecret, expectedSecret))
        {
            throw new UnauthorizedAppException("Invalid webhook secret.");
        }
    }

    private static bool SecretMatches(string providedSecret, string expectedSecret)
    {
        var providedBytes = Encoding.UTF8.GetBytes(providedSecret);
        var expectedBytes = Encoding.UTF8.GetBytes(expectedSecret);

        if (providedBytes.Length != expectedBytes.Length)
        {
            return false;
        }

        return CryptographicOperations.FixedTimeEquals(providedBytes, expectedBytes);
    }
}


