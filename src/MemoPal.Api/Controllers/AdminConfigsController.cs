using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Features.Badges.Commands;
using MemoPal.Application.Features.Badges.DTOs;
using MemoPal.Application.Features.Badges.Queries;
using MemoPal.Application.Features.Configs.Commands;
using MemoPal.Application.Features.Configs.DTOs;
using MemoPal.Application.Features.Configs.Queries;
using MemoPal.Application.Features.Milestones.Commands;
using MemoPal.Application.Features.Milestones.DTOs;
using MemoPal.Application.Features.Milestones.Queries;
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

    [HttpGet("xp-configs")]
    public async Task<ActionResult<PaginatedResponse<XpConfigDto>>> GetXpConfigs(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var page = await Sender.Send(new GetPagedXpConfigsQuery(pageNumber, pageSize), cancellationToken);
        return Ok(PaginatedResponse<XpConfigDto>.Ok(page.Items, page.PageNumber, page.PageSize, page.TotalCount));
    }

    [HttpGet("xp-configs/{sourceType}")]
    public async Task<ActionResult<ApiResponse<XpConfigDto>>> GetXpConfigBySourceType(string sourceType, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetXpConfigBySourceTypeQuery(sourceType), cancellationToken);`n        return Ok(result);
    }

    [HttpPost("xp-configs")]
    public async Task<ActionResult<ApiResponse<XpConfigDto>>> CreateXpConfig([FromBody] XpConfigUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new CreateXpConfigCommand(request), cancellationToken);`n        return Ok(result);
    }

    [HttpPatch("xp-configs/{id}")]
    public async Task<ActionResult<ApiResponse<XpConfigDto>>> UpdateXpConfig(string id, [FromBody] XpConfigUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpdateXpConfigCommand(id, request), cancellationToken);`n        return Ok(result);
    }

    [HttpDelete("xp-configs/{id}")]
    public async Task<ActionResult<ApiResponse<object?>>> DeleteXpConfig(string id, CancellationToken cancellationToken)
    {
        await Sender.Send(new DeleteXpConfigCommand(id), cancellationToken);
        return Ok(ApiResponse<object?>.Ok(null));
    }

    [HttpGet("level-configs")]
    public async Task<ActionResult<PaginatedResponse<LevelConfigDto>>> GetLevelConfigs(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var page = await Sender.Send(new GetPagedLevelConfigsQuery(pageNumber, pageSize), cancellationToken);
        return Ok(PaginatedResponse<LevelConfigDto>.Ok(page.Items, page.PageNumber, page.PageSize, page.TotalCount));
    }

    [HttpGet("level-configs/{level:int}")]
    public async Task<ActionResult<ApiResponse<LevelConfigDto>>> GetLevelConfig(int level, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetLevelConfigQuery(level), cancellationToken);`n        return Ok(result);
    }

    [HttpPost("level-configs")]
    public async Task<ActionResult<ApiResponse<LevelConfigDto>>> CreateLevelConfig([FromBody] LevelConfigUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new CreateLevelConfigCommand(request), cancellationToken);`n        return Ok(result);
    }

    [HttpPut("level-configs/{level:int}")]
    public async Task<ActionResult<ApiResponse<LevelConfigDto>>> UpdateLevelConfig(int level, [FromBody] LevelConfigUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpdateLevelConfigCommand(level, request), cancellationToken);`n        return Ok(result);
    }

    [HttpDelete("level-configs/{level:int}")]
    public async Task<ActionResult<ApiResponse<object?>>> DeleteLevelConfig(int level, CancellationToken cancellationToken)
    {
        await Sender.Send(new DeleteLevelConfigCommand(level), cancellationToken);
        return Ok(ApiResponse<object?>.Ok(null));
    }

    [HttpGet("badge-definitions")]
    public async Task<ActionResult<PaginatedResponse<BadgeDefinitionDto>>> GetBadgeDefinitions(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var page = await Sender.Send(new GetPagedBadgeDefinitionsQuery(pageNumber, pageSize, search), cancellationToken);
        return Ok(PaginatedResponse<BadgeDefinitionDto>.Ok(page.Items, page.PageNumber, page.PageSize, page.TotalCount));
    }

    [HttpGet("badge-definitions/{badgeId}")]
    public async Task<ActionResult<ApiResponse<BadgeDefinitionDto>>> GetBadgeDefinition(string badgeId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetBadgeDefinitionQuery(badgeId), cancellationToken);`n        return Ok(result);
    }

    [HttpPost("badge-definitions")]
    public async Task<ActionResult<ApiResponse<BadgeDefinitionDto>>> CreateBadgeDefinition([FromBody] BadgeDefinitionUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new CreateBadgeDefinitionCommand(request), cancellationToken);`n        return Ok(result);
    }

    [HttpPut("badge-definitions/{badgeId}")]
    public async Task<ActionResult<ApiResponse<BadgeDefinitionDto>>> UpdateBadgeDefinition(string badgeId, [FromBody] BadgeDefinitionUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpdateBadgeDefinitionCommand(badgeId, request), cancellationToken);`n        return Ok(result);
    }

    [HttpDelete("badge-definitions/{badgeId}")]
    public async Task<ActionResult<ApiResponse<object?>>> DeleteBadgeDefinition(string badgeId, CancellationToken cancellationToken)
    {
        await Sender.Send(new DeleteBadgeDefinitionCommand(badgeId), cancellationToken);
        return Ok(ApiResponse<object?>.Ok(null));
    }

    [HttpGet("milestone-definitions")]
    public async Task<ActionResult<PaginatedResponse<MilestoneDefinitionDto>>> GetMilestoneDefinitions(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var page = await Sender.Send(new GetPagedMilestoneDefinitionsQuery(pageNumber, pageSize, search), cancellationToken);
        return Ok(PaginatedResponse<MilestoneDefinitionDto>.Ok(page.Items, page.PageNumber, page.PageSize, page.TotalCount));
    }

    [HttpGet("milestone-definitions/{milestoneId}")]
    public async Task<ActionResult<ApiResponse<MilestoneDefinitionDto>>> GetMilestoneDefinition(string milestoneId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetMilestoneDefinitionQuery(milestoneId), cancellationToken);`n        return Ok(result);
    }

    [HttpPost("milestone-definitions")]
    public async Task<ActionResult<ApiResponse<MilestoneDefinitionDto>>> CreateMilestoneDefinition([FromBody] MilestoneDefinitionUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new CreateMilestoneDefinitionCommand(request), cancellationToken);`n        return Ok(result);
    }

    [HttpPut("milestone-definitions/{milestoneId}")]
    public async Task<ActionResult<ApiResponse<MilestoneDefinitionDto>>> UpdateMilestoneDefinition(string milestoneId, [FromBody] MilestoneDefinitionUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpdateMilestoneDefinitionCommand(milestoneId, request), cancellationToken);`n        return Ok(result);
    }

    [HttpDelete("milestone-definitions/{milestoneId}")]
    public async Task<ActionResult<ApiResponse<object?>>> DeleteMilestoneDefinition(string milestoneId, CancellationToken cancellationToken)
    {
        await Sender.Send(new DeleteMilestoneDefinitionCommand(milestoneId), cancellationToken);
        return Ok(ApiResponse<object?>.Ok(null));
    }
}

