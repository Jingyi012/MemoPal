using MediatR;
using MemoPal.Application.Features.Users.Commands;
using MemoPal.Application.Features.Users.DTOs;
using MemoPal.Application.Features.Users.Queries;
using MemoPal.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize(Roles = UserRoles.Admin)]
[Route("admin/users")]
public sealed class AdminUsersController : ApiControllerBase
{
    public AdminUsersController(ISender sender) : base(sender)
    {
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] bool includeDeleted = false,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetPagedManagedUsersQuery(pageNumber, pageSize, search, includeDeleted), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{userId}")]
    public async Task<IActionResult> GetUser(string userId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetManagedUserQuery(userId), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{userId}/data/xp-events")]
    public async Task<IActionResult> GetUserDataXpEvents(
        string userId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetManagedUserXpEventsQuery(userId, pageNumber, pageSize), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{userId}/data/badges")]
    public async Task<IActionResult> GetUserDataBadges(
        string userId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetManagedUserBadgesQuery(userId, pageNumber, pageSize), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{userId}/data/milestones")]
    public async Task<IActionResult> GetUserDataMilestones(
        string userId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetManagedUserMilestonesQuery(userId, pageNumber, pageSize), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{userId}/data/notifications")]
    public async Task<IActionResult> GetUserDataNotifications(
        string userId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetManagedUserNotificationsQuery(userId, pageNumber, pageSize), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{userId}/data/subscriptions")]
    public async Task<IActionResult> GetUserDataSubscriptions(
        string userId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetManagedUserSubscriptionsQuery(userId, pageNumber, pageSize), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] ManagedUserUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new CreateManagedUserCommand(request), cancellationToken);
        return Ok(result);
    }

    [HttpPut("{userId}")]
    public async Task<IActionResult> UpdateUser(string userId, [FromBody] ManagedUserUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpdateManagedUserCommand(userId, request), cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{userId}")]
    public async Task<IActionResult> DeleteUser(string userId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new DeleteManagedUserCommand(userId), cancellationToken);
        return Ok(result);
    }

}
