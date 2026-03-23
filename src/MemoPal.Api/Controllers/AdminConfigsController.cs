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

    [HttpGet("xp-configs")]
    public async Task<IActionResult> GetXpConfigs(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetPagedXpConfigsQuery(pageNumber, pageSize), cancellationToken);
        return Ok(result);
    }

    [HttpGet("xp-configs/{sourceType}")]
    public async Task<IActionResult> GetXpConfigBySourceType(string sourceType, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetXpConfigBySourceTypeQuery(sourceType), cancellationToken); return Ok(result);
    }

    [HttpPost("xp-configs")]
    public async Task<IActionResult> CreateXpConfig([FromBody] XpConfigUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new CreateXpConfigCommand(request), cancellationToken); return Ok(result);
    }

    [HttpPatch("xp-configs/{id}")]
    public async Task<IActionResult> UpdateXpConfig(string id, [FromBody] XpConfigUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpdateXpConfigCommand(id, request), cancellationToken); return Ok(result);
    }

    [HttpDelete("xp-configs/{id}")]
    public async Task<IActionResult> DeleteXpConfig(string id, CancellationToken cancellationToken)
    {
        await Sender.Send(new DeleteXpConfigCommand(id), cancellationToken);
        return Ok(ApiResponse<object?>.Ok(null));
    }

    [HttpGet("level-configs")]
    public async Task<IActionResult> GetLevelConfigs(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetPagedLevelConfigsQuery(pageNumber, pageSize), cancellationToken);
        return Ok(result);
    }

    [HttpGet("level-configs/{level:int}")]
    public async Task<IActionResult> GetLevelConfig(int level, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetLevelConfigQuery(level), cancellationToken); 
        return Ok(result);
    }

    [HttpPost("level-configs")]
    public async Task<IActionResult> CreateLevelConfig([FromBody] LevelConfigUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new CreateLevelConfigCommand(request), cancellationToken); 
        return Ok(result);
    }

    [HttpPut("level-configs/{level:int}")]
    public async Task<IActionResult> UpdateLevelConfig(int level, [FromBody] LevelConfigUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpdateLevelConfigCommand(level, request), cancellationToken); 
        return Ok(result);
    }

    [HttpDelete("level-configs/{level:int}")]
    public async Task<IActionResult> DeleteLevelConfig(int level, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new DeleteLevelConfigCommand(level), cancellationToken);
        return Ok(result);
    }

    [HttpGet("badge-definitions")]
    public async Task<IActionResult> GetBadgeDefinitions(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetPagedBadgeDefinitionsQuery(pageNumber, pageSize, search), cancellationToken);
        return Ok(result);
    }

    [HttpGet("badge-definitions/{badgeId}")]
    public async Task<IActionResult> GetBadgeDefinition(string badgeId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetBadgeDefinitionQuery(badgeId), cancellationToken); 
        return Ok(result);
    }

    [HttpPost("badge-definitions")]
    public async Task<IActionResult> CreateBadgeDefinition([FromBody] BadgeDefinitionUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new CreateBadgeDefinitionCommand(request), cancellationToken); 
        return Ok(result);
    }

    [HttpPut("badge-definitions/{badgeId}")]
    public async Task<IActionResult> UpdateBadgeDefinition(string badgeId, [FromBody] BadgeDefinitionUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpdateBadgeDefinitionCommand(badgeId, request), cancellationToken); 
        return Ok(result);
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

