using MediatR;
using MemoPal.Application.Features.Referrals.Commands;
using MemoPal.Application.Features.Referrals.DTOs;
using MemoPal.Application.Features.Referrals.Queries;
using MemoPal.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize(Roles = UserRoles.Admin)]
[Route("admin/referrals")]
public sealed class AdminReferralsController : ApiControllerBase
{
    public AdminReferralsController(ISender sender) : base(sender)
    {
    }

    [HttpGet("config")]
    public async Task<IActionResult> GetConfig(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetReferralProgramConfigQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpPut("config")]
    public async Task<IActionResult> UpdateConfig([FromBody] UpsertReferralProgramConfigRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpsertReferralProgramConfigCommand(request), cancellationToken);
        return Ok(result);
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(new GetPagedReferralUsersQuery(pageNumber, pageSize, search), cancellationToken);
        return Ok(result);
    }

    [HttpGet("records")]
    public async Task<IActionResult> GetRecords(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? referrerUserId = null,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(
            new GetPagedReferralRecordsQuery(pageNumber, pageSize, search, referrerUserId),
            cancellationToken);
        return Ok(result);
    }
}
