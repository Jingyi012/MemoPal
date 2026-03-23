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
