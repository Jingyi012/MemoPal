using MemoPal.Api.Security;
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

    /// <summary>
    /// Fetch all public system settings used by the mobile app.
    /// </summary>
    [HttpGet("all")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetAllSettings(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetAllSystemSettingsQuery(), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Fetch feature limits settings
    /// </summary>
    [HttpGet("feature-limits")]
    [RestrictedLearner(RestrictedLearnerAccess.Allow)]
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
    [RestrictedLearner(RestrictedLearnerAccess.Allow)]
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
    [RestrictedLearner(RestrictedLearnerAccess.Allow)]
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
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetPremiumSubscription(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new GetSystemSettingsByKeyQuery(SystemSettingKeys.PremiumSubscription),
            cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Fetch level configurations
    /// </summary>
    [HttpGet("level-configs")]
    [RestrictedLearner(RestrictedLearnerAccess.Allow)]
    public async Task<IActionResult> GetLevelConfigs(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetSystemSettingsByKeyQuery(SystemSettingKeys.LevelConfigs), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Fetch the simple, user-visible gamification rules.
    /// </summary>
    [HttpGet("gamification-rules")]
    [RestrictedLearner(RestrictedLearnerAccess.Allow)]
    public async Task<IActionResult> GetGamificationRules(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetGamificationRulesQuery(), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Fetch the editable 1–100 Number Peg definitions.
    /// </summary>
    [HttpGet("number-peg-definitions")]
    [RestrictedLearner(RestrictedLearnerAccess.Allow)]
    public async Task<IActionResult> GetNumberPegDefinitions(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new GetSystemSettingsByKeyQuery(SystemSettingKeys.NumberPegDefinitions),
            cancellationToken);
        return Ok(result);
    }
}
