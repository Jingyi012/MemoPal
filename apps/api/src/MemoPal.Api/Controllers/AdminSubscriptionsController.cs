using MemoPal.Api.Security;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Features.Subscriptions.Commands;
using MemoPal.Application.Features.Subscriptions.Admin.Contracts;
using MemoPal.Application.Features.Subscriptions.Queries;
using MemoPal.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize(Roles = UserRoles.Admin)]
[Route("admin/subscriptions")]
public sealed class AdminSubscriptionsController : ApiControllerBase
{
    public AdminSubscriptionsController(ISender sender) : base(sender)
    {
    }

    [HttpGet]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(
            new GetPagedUserSubscriptionsQuery(new SubscriptionFilter
            {
                PageNumber = pageNumber,
                PageSize = pageSize,
                Search = search,
                Status = status,
            }),
            cancellationToken);

        return Ok(result);
    }

    [HttpPatch("{subscriptionId}")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> Update(
        [FromRoute] string subscriptionId,
        [FromBody] UpdateSubscriptionRequest request,
        CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpdateUserSubscriptionCommand(subscriptionId, request), cancellationToken);
        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }
}

