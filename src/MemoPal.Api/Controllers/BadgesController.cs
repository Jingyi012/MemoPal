using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Features.Badges.Commands;
using MemoPal.Application.Features.Badges.DTOs;
using MemoPal.Application.Features.Badges.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
public sealed class BadgesController : ApiControllerBase
{
    public BadgesController(ISender sender) : base(sender)
    {
    }

    [HttpGet("/badges")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<BadgeDto>>>> GetAll(CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetBadgesQuery(GetUserIdOrThrow()), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<BadgeDto>>.Ok(data));
    }

    [HttpGet("/badges/{badgeId}")]
    public async Task<ActionResult<ApiResponse<BadgeDto>>> GetById(string badgeId, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetBadgeQuery(GetUserIdOrThrow(), badgeId), cancellationToken);
        return Ok(ApiResponse<BadgeDto>.Ok(data));
    }

    [HttpPost("/badges/{badgeId}/award")]
    public async Task<ActionResult<ApiResponse<bool>>> Award(string badgeId, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new AwardBadgeCommand(GetUserIdOrThrow(), badgeId), cancellationToken);
        return Ok(ApiResponse<bool>.Ok(data));
    }

    [HttpGet("/badges/updated")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<BadgeDto>>>> GetUpdated([FromQuery] DateTime since, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetUpdatedBadgesQuery(GetUserIdOrThrow(), since), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<BadgeDto>>.Ok(data));
    }
}
