using MemoPal.Api.Security;
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

    [HttpPut("{userId}/account-mode")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> SetAccountMode(string userId,
        [FromBody] SetAccountModeRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new SetAccountModeCommand(GetUserIdOrThrow(), userId, request), ct));

    [HttpPost("{userId}/memory-sets/{memorySetId}/make-private")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> MakeRestrictedMemoryPrivate(string userId, string memorySetId,
        [FromBody] MakeRestrictedMemoryPrivateRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new MakeRestrictedMemoryPrivateCommand(GetUserIdOrThrow(), userId, memorySetId, request.Reason), ct));

    [HttpGet]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
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
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetUser(string userId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetManagedUserQuery(userId), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{userId}/data/xp-events")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetUserDataXpEvents(
        string userId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetManagedUserXpEventsQuery(userId, pageNumber, pageSize), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{userId}/data/milestones")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
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
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
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
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
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
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> CreateUser([FromBody] ManagedUserUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new CreateManagedUserCommand(request), cancellationToken);
        return Ok(result);
    }

    [HttpPut("{userId}")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> UpdateUser(string userId, [FromBody] ManagedUserUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpdateManagedUserCommand(
            GetUserIdOrThrow(), userId, request), cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{userId}")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> DeleteUser(string userId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new DeleteManagedUserCommand(
            GetUserIdOrThrow(), userId), cancellationToken);
        return Ok(result);
    }

}
