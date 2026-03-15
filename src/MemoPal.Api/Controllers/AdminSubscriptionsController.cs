using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Features.Subscriptions.Commands;
using MemoPal.Application.Features.Subscriptions.DTOs;
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
    public async Task<ActionResult<PaginatedResponse<AdminUserSubscriptionDto>>> GetPaged(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(
            new GetPagedUserSubscriptionsQuery(new AdminSubscriptionFilter
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
    public async Task<ActionResult<ApiResponse<AdminUserSubscriptionDto>>> Update(
        [FromRoute] string subscriptionId,
        [FromBody] AdminUpdateSubscriptionRequest request,
        CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpdateUserSubscriptionCommand(subscriptionId, request), cancellationToken);
        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }
}
