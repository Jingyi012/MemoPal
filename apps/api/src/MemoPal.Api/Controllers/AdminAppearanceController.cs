using MediatR;
using MemoPal.Application.Features.Appearance.Commands;
using MemoPal.Application.Features.Appearance.DTOs;
using MemoPal.Application.Features.Appearance.Queries;
using MemoPal.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize(Roles = UserRoles.Admin)]
[Route("admin/appearance-items")]
public sealed class AdminAppearanceController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet]
    public async Task<IActionResult> GetItems(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetPagedAppearanceDefinitionsQuery(pageNumber, pageSize, search), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AppearanceDefinitionUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new CreateAppearanceDefinitionCommand(request), cancellationToken);
        return Ok(result);
    }

    [HttpPut("{appearanceId}")]
    public async Task<IActionResult> Update(string appearanceId, [FromBody] AppearanceDefinitionUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpdateAppearanceDefinitionCommand(appearanceId, request), cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{appearanceId}")]
    public async Task<IActionResult> Delete(string appearanceId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new DeleteAppearanceDefinitionCommand(appearanceId), cancellationToken);
        return Ok(result);
    }
}
