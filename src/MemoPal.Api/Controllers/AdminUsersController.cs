using MediatR;
using MemoPal.Application.Common;
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
        if (!result.Success || result.Data is null)
        {
            return Ok(result);
        }

        var mapped = MapMediaUrls(result.Data);
        return Ok(PaginatedResponse<ManagedUserDto>.Ok(
            mapped,
            result.Pagination.PageNumber,
            result.Pagination.PageSize,
            result.Pagination.TotalCount,
            result.Message));
    }

    [HttpGet("{userId}")]
    public async Task<IActionResult> GetUser(string userId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetManagedUserQuery(userId), cancellationToken);
        if (!result.Success || result.Data is null)
        {
            return Ok(result);
        }

        return Ok(ApiResponse<ManagedUserDto>.Ok(MapMediaUrls(result.Data), result.Message));
    }

    [HttpGet("{userId}/data")]
    public async Task<IActionResult> GetUserData(string userId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetManagedUserDataQuery(userId), cancellationToken);
        if (!result.Success || result.Data is null)
        {
            return Ok(result);
        }

        return Ok(ApiResponse<ManagedUserDataDto>.Ok(MapMediaUrls(result.Data), result.Message));
    }

    [HttpGet("{userId}/data/overview")]
    public async Task<IActionResult> GetUserDataOverview(string userId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetManagedUserDataOverviewQuery(userId), cancellationToken);
        if (!result.Success || result.Data is null)
        {
            return Ok(result);
        }

        var mapped = result.Data with
        {
            User = MapMediaUrls(result.Data.User)
        };

        return Ok(ApiResponse<ManagedUserDataOverviewDto>.Ok(mapped, result.Message));
    }

    [HttpGet("{userId}/data/palaces")]
    public async Task<IActionResult> GetUserDataPalaces(string userId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetManagedUserPalacesQuery(userId), cancellationToken);
        if (!result.Success || result.Data is null)
        {
            return Ok(result);
        }

        return Ok(ApiResponse<IReadOnlyList<ManagedUserPalaceDataDto>>.Ok(MapMediaUrls(result.Data), result.Message));
    }

    [HttpGet("{userId}/data/palaces/paged")]
    public async Task<IActionResult> GetUserDataPalacesPaged(
        string userId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool? isCustom = null,
        [FromQuery] bool requireUserLessons = false,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(
            new GetManagedUserPalacesPagedQuery(userId, pageNumber, pageSize, isCustom, requireUserLessons),
            cancellationToken);
        return Ok(result);
    }

    [HttpGet("{userId}/data/lessons")]
    public async Task<IActionResult> GetUserDataLessons(
        string userId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? palaceId = null,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetManagedUserLessonsQuery(userId, pageNumber, pageSize, palaceId), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{userId}/data/progresses")]
    public async Task<IActionResult> GetUserDataProgresses(
        string userId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetManagedUserProgressesQuery(userId, pageNumber, pageSize), cancellationToken);
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
        if (!result.Success || result.Data is null)
        {
            return Ok(result);
        }

        return Ok(ApiResponse<ManagedUserDto>.Ok(MapMediaUrls(result.Data), result.Message));
    }

    [HttpPut("{userId}")]
    public async Task<IActionResult> UpdateUser(string userId, [FromBody] ManagedUserUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpdateManagedUserCommand(userId, request), cancellationToken);
        if (!result.Success || result.Data is null)
        {
            return Ok(result);
        }

        return Ok(ApiResponse<ManagedUserDto>.Ok(MapMediaUrls(result.Data), result.Message));
    }

    [HttpDelete("{userId}")]
    public async Task<IActionResult> DeleteUser(string userId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new DeleteManagedUserCommand(userId), cancellationToken);
        return Ok(result);
    }

}
