using MediatR;
using MemoPal.Application.Features.Missions.Queries;
using MemoPal.Application.Features.SystemSettings.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
[Route("system-settings")]
public sealed class SystemSettingsController : ApiControllerBase
{
    public SystemSettingsController(ISender sender) : base(sender)
    {
    }

    [HttpGet("gamification/mobile-ui-config")]
    public async Task<IActionResult> GetGamificationMobileUiConfig(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetGamificationMobileUiConfigQuery(), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Fetch all system settings for mobile app (feature limits, gamification configs, mission templates, etc.)
    /// Used on app startup and manual refresh to populate local cache
    /// </summary>
    [HttpGet("all")]
    public async Task<IActionResult> GetAllSettings(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetAllSystemSettingsQuery(), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Fetch feature limits settings
    /// </summary>
    [HttpGet("feature-limits")]
    public async Task<IActionResult> GetFeatureLimits(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetSystemSettingsByPatternQuery("limits.*"), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Fetch mission templates
    /// </summary>
    [HttpGet("mission-templates")]
    public async Task<IActionResult> GetMissionTemplates(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetSystemSettingsByKeyQuery("gamification.missions.templates"), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Fetch XP configurations
    /// </summary>
    [HttpGet("xp-configs")]
    public async Task<IActionResult> GetXpConfigs(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetSystemSettingsByPatternQuery("xp.*"), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Fetch level configurations
    /// </summary>
    [HttpGet("level-configs")]
    public async Task<IActionResult> GetLevelConfigs(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetSystemSettingsByPatternQuery("level.*"), cancellationToken);
        return Ok(result);
    }
}
