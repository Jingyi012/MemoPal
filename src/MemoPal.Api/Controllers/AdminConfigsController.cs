using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Features.Badges.Commands;
using MemoPal.Application.Features.Badges.DTOs;
using MemoPal.Application.Features.Badges.Queries;
using MemoPal.Application.Features.Milestones.Commands;
using MemoPal.Application.Features.Milestones.DTOs;
using MemoPal.Application.Features.Milestones.Queries;
using MemoPal.Application.Features.Missions.Commands;
using MemoPal.Application.Features.Missions.DTOs;
using MemoPal.Application.Features.Missions.Queries;
using MemoPal.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize(Roles = UserRoles.Admin)]
[Route("admin")]
public sealed class AdminConfigsController : ApiControllerBase
{
    public AdminConfigsController(ISender sender) : base(sender)
    {
    }

    [HttpGet("badge-definitions")]
    public async Task<IActionResult> GetBadgeDefinitions(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetPagedBadgeDefinitionsQuery(pageNumber, pageSize, search), cancellationToken);
        if (!result.Success || result.Data is null)
        {
            return Ok(result);
        }

        var mapped = MapMediaUrls(result.Data);
        return Ok(PaginatedResponse<BadgeDefinitionDto>.Ok(
            mapped,
            result.Pagination.PageNumber,
            result.Pagination.PageSize,
            result.Pagination.TotalCount,
            result.Message));
    }

    [HttpGet("badge-definitions/{badgeId}")]
    public async Task<IActionResult> GetBadgeDefinition(string badgeId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetBadgeDefinitionQuery(badgeId), cancellationToken); 
        if (!result.Success || result.Data is null)
        {
            return Ok(result);
        }

        return Ok(ApiResponse<BadgeDefinitionDto>.Ok(MapMediaUrls(result.Data), result.Message));
    }

    [HttpPost("badge-definitions")]
    public async Task<IActionResult> CreateBadgeDefinition([FromBody] BadgeDefinitionUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new CreateBadgeDefinitionCommand(request), cancellationToken); 
        if (!result.Success || result.Data is null)
        {
            return Ok(result);
        }

        return Ok(ApiResponse<BadgeDefinitionDto>.Ok(MapMediaUrls(result.Data), result.Message));
    }

    [HttpPut("badge-definitions/{badgeId}")]
    public async Task<IActionResult> UpdateBadgeDefinition(string badgeId, [FromBody] BadgeDefinitionUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpdateBadgeDefinitionCommand(badgeId, request), cancellationToken); 
        if (!result.Success || result.Data is null)
        {
            return Ok(result);
        }

        return Ok(ApiResponse<BadgeDefinitionDto>.Ok(MapMediaUrls(result.Data), result.Message));
    }

    [HttpDelete("badge-definitions/{badgeId}")]
    public async Task<IActionResult> DeleteBadgeDefinition(string badgeId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new DeleteBadgeDefinitionCommand(badgeId), cancellationToken);
        return Ok(result);
    }

    [HttpGet("milestone-definitions")]
    public async Task<IActionResult> GetMilestoneDefinitions(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetPagedMilestoneDefinitionsQuery(pageNumber, pageSize, search), cancellationToken);
        return Ok(result);
    }

    [HttpGet("milestone-definitions/{milestoneId}")]
    public async Task<IActionResult> GetMilestoneDefinition(string milestoneId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetMilestoneDefinitionQuery(milestoneId), cancellationToken); 
        return Ok(result);
    }

    [HttpPost("milestone-definitions")]
    public async Task<IActionResult> CreateMilestoneDefinition([FromBody] MilestoneDefinitionUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new CreateMilestoneDefinitionCommand(request), cancellationToken); 
        return Ok(result);
    }

    [HttpPut("milestone-definitions/{milestoneId}")]
    public async Task<IActionResult> UpdateMilestoneDefinition(string milestoneId, [FromBody] MilestoneDefinitionUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpdateMilestoneDefinitionCommand(milestoneId, request), cancellationToken); 
        return Ok(result);
    }

    [HttpDelete("milestone-definitions/{milestoneId}")]
    public async Task<IActionResult> DeleteMilestoneDefinition(string milestoneId, CancellationToken cancellationToken)
    {
        await Sender.Send(new DeleteMilestoneDefinitionCommand(milestoneId), cancellationToken);
        return Ok(ApiResponse<object?>.Ok(null));
    }

    [HttpGet("mission-templates")]
    public async Task<IActionResult> GetMissionTemplates(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetMissionTemplatesQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpPut("mission-templates")]
    public async Task<IActionResult> UpsertMissionTemplates([FromBody] UpsertMissionTemplatesRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpsertMissionTemplatesCommand(request), cancellationToken);
        return Ok(result);
    }
}
