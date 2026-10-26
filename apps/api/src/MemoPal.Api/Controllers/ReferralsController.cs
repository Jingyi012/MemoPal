using MemoPal.Api.Security;
using MediatR;
using MemoPal.Application.Features.Referrals.Commands;
using MemoPal.Application.Features.Referrals.DTOs;
using MemoPal.Application.Features.Referrals.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
public sealed class ReferralsController : ApiControllerBase
{
    public ReferralsController(ISender sender) : base(sender)
    {
    }

    [HttpGet("/referrals/me")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetMyReferralSummary(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetReferralSummaryQuery(GetUserIdOrThrow()), cancellationToken);
        return Ok(result);
    }

    [HttpPost("/referrals/redeem")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> RedeemCode([FromBody] RedeemReferralRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new RedeemReferralCodeCommand(GetUserIdOrThrow(), request), cancellationToken);
        return Ok(result);
    }
}
