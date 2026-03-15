using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Features.SystemSettings.Commands;
using MemoPal.Application.Features.SystemSettings.DTOs;
using MemoPal.Application.Features.SystemSettings.Queries;
using MemoPal.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize(Roles = UserRoles.Admin)]
[Route("admin/system-settings")]
public sealed class AdminSystemSettingsController : ApiControllerBase
{
    public AdminSystemSettingsController(ISender sender) : base(sender)
    {
    }

    [HttpGet]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetSystemSettingsQuery(pageNumber, pageSize, search), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Upsert(
        [FromBody] UpsertSystemSettingRequest request,
        CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpsertSystemSettingCommand(request), cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}

