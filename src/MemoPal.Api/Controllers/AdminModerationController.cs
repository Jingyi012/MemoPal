using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Features.Admin.Commands;
using MemoPal.Application.Features.Admin.DTOs;
using MemoPal.Application.Features.Admin.Queries;
using MemoPal.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize(Roles = UserRoles.Admin)]
[Route("admin/moderation")]
public sealed class AdminModerationController : ApiControllerBase
{
    public AdminModerationController(ISender sender) : base(sender)
    {
    }

    [HttpGet("custom-content")]
    public async Task<ActionResult<PaginatedResponse<AdminModerationItemDto>>> GetCustomContent(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetCustomContentModerationQuery(pageNumber, pageSize), cancellationToken);
        return Ok(result);
    }

    [HttpPatch("{type}/{id}")]
    public async Task<ActionResult<ApiResponse<AdminModerationItemDto>>> UpdateItem(
        [FromRoute] string type,
        [FromRoute] string id,
        [FromBody] AdminModerationUpdateRequest request,
        CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpdateModerationItemCommand(type, id, request), cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}
