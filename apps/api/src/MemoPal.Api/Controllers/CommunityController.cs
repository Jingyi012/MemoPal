using MediatR;
using MemoPal.Application.Features.Community.DTOs;
using MemoPal.Application.Features.Community.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
[Route("community")]
public sealed class CommunityController : ApiControllerBase
{
    public CommunityController(ISender sender) : base(sender)
    {
    }

    [HttpGet("lessons")]
    public async Task<IActionResult> GetLessons(
        [FromQuery] string? search = null,
        [FromQuery] string? category = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(
            new GetCommunityLessonsQuery(
                GetUserIdOrThrow(),
                Search: search,
                Category: category,
                PageNumber: pageNumber,
                PageSize: pageSize,
                MineOnly: false),
            cancellationToken);
        return Ok(result);
    }

    [HttpGet("lessons/mine")]
    public async Task<IActionResult> GetMyLessons(
        [FromQuery] string? search = null,
        [FromQuery] string? category = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(
            new GetCommunityLessonsQuery(
                GetUserIdOrThrow(),
                Search: search,
                Category: category,
                PageNumber: pageNumber,
                PageSize: pageSize,
                MineOnly: true),
            cancellationToken);
        return Ok(result);
    }

    [HttpGet("lessons/by-code/{shareCode}")]
    public async Task<IActionResult> GetLessonByShareCode(
        string shareCode,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(
            new GetCommunityLessonByShareCodeQuery(GetUserIdOrThrow(), shareCode),
            cancellationToken);
        return Ok(result);
    }
}
