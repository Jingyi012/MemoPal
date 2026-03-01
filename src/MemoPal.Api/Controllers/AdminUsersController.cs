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
    public async Task<ActionResult<PaginatedResponse<ManagedUserDto>>> GetUsers(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] bool includeDeleted = false,
        CancellationToken cancellationToken = default)
    {
        var page = await Sender.Send(new GetPagedManagedUsersQuery(pageNumber, pageSize, search, includeDeleted), cancellationToken);
        return Ok(PaginatedResponse<ManagedUserDto>.Ok(page.Items, page.PageNumber, page.PageSize, page.TotalCount));
    }

    [HttpGet("{userId}")]
    public async Task<ActionResult<ApiResponse<ManagedUserDto>>> GetUser(string userId, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetManagedUserQuery(userId), cancellationToken);
        return Ok(ApiResponse<ManagedUserDto>.Ok(data));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ManagedUserDto>>> CreateUser([FromBody] ManagedUserUpsertRequest request, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new CreateManagedUserCommand(request), cancellationToken);
        return Ok(ApiResponse<ManagedUserDto>.Ok(data));
    }

    [HttpPut("{userId}")]
    public async Task<ActionResult<ApiResponse<ManagedUserDto>>> UpdateUser(string userId, [FromBody] ManagedUserUpsertRequest request, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new UpdateManagedUserCommand(userId, request), cancellationToken);
        return Ok(ApiResponse<ManagedUserDto>.Ok(data));
    }

    [HttpDelete("{userId}")]
    public async Task<ActionResult<ApiResponse<object?>>> DeleteUser(string userId, CancellationToken cancellationToken)
    {
        await Sender.Send(new DeleteManagedUserCommand(userId), cancellationToken);
        return Ok(ApiResponse<object?>.Ok(null));
    }
}
