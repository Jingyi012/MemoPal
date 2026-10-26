using MemoPal.Api.Security;
using MediatR;
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

    [HttpGet("milestone-definitions")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
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
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetMilestoneDefinition(string milestoneId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetMilestoneDefinitionQuery(milestoneId), cancellationToken); 
        return Ok(result);
    }

    [HttpPost("milestone-definitions")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> CreateMilestoneDefinition([FromBody] MilestoneDefinitionUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new CreateMilestoneDefinitionCommand(request), cancellationToken); 
        return Ok(result);
    }

    [HttpPut("milestone-definitions/{milestoneId}")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> UpdateMilestoneDefinition(string milestoneId, [FromBody] MilestoneDefinitionUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpdateMilestoneDefinitionCommand(milestoneId, request), cancellationToken); 
        return Ok(result);
    }

    [HttpDelete("milestone-definitions/{milestoneId}")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> DeleteMilestoneDefinition(string milestoneId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new DeleteMilestoneDefinitionCommand(milestoneId), cancellationToken);
        return Ok(result);
    }
}
