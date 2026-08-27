using MediatR;
using MemoPal.Application.Common.Settings;
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
        var result = await Sender.Send(
            new GetSystemSettingsByKeyQuery(SystemSettingKeys.GamificationMobileUiConfig),
            cancellationToken);
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
        var result = await Sender.Send(
            new GetSystemSettingsByKeyQuery(SystemSettingKeys.FeatureLimits),
            cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Fetch help and FAQ settings.
    /// </summary>
    [HttpGet("help-faq")]
    public async Task<IActionResult> GetHelpFaq(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new GetSystemSettingsByKeyQuery(SystemSettingKeys.SupportHelpFaq),
            cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Fetch privacy policy settings.
    /// </summary>
    [HttpGet("privacy-policy")]
    public async Task<IActionResult> GetPrivacyPolicy(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new GetSystemSettingsByKeyQuery(SystemSettingKeys.SupportPrivacyPolicy),
            cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Fetch premium subscription page configuration.
    /// </summary>
    [HttpGet("premium-subscription")]
    public async Task<IActionResult> GetPremiumSubscription(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new GetSystemSettingsByKeyQuery(SystemSettingKeys.PremiumSubscription),
            cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Fetch XP configurations
    /// </summary>
    [HttpGet("xp-configs")]
    public async Task<IActionResult> GetXpConfigs(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetSystemSettingsByKeyQuery(SystemSettingKeys.XpConfigs), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Fetch level configurations
    /// </summary>
    [HttpGet("level-configs")]
    public async Task<IActionResult> GetLevelConfigs(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetSystemSettingsByKeyQuery(SystemSettingKeys.LevelConfigs), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Fetch the editable 1–100 Number Peg definitions.
    /// </summary>
    [HttpGet("number-peg-definitions")]
    public async Task<IActionResult> GetNumberPegDefinitions(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new GetSystemSettingsByKeyQuery(SystemSettingKeys.NumberPegDefinitions),
            cancellationToken);
        return Ok(result);
    }
}
