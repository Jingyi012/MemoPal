using MediatR;
using MemoPal.Application.Common;
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

        if (!result.Success || result.Data is null)
        {
            return Ok(result);
        }

        return Ok(PaginatedResponse<CommunityLessonDto>.Ok(
            MapMediaUrls(result.Data),
            result.Pagination.PageNumber,
            result.Pagination.PageSize,
            result.Pagination.TotalCount,
            result.Message));
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

        if (!result.Success || result.Data is null)
        {
            return Ok(result);
        }

        return Ok(PaginatedResponse<CommunityLessonDto>.Ok(
            MapMediaUrls(result.Data),
            result.Pagination.PageNumber,
            result.Pagination.PageSize,
            result.Pagination.TotalCount,
            result.Message));
    }

    [HttpGet("lessons/by-code/{shareCode}")]
    public async Task<IActionResult> GetLessonByShareCode(
        string shareCode,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(
            new GetCommunityLessonByShareCodeQuery(GetUserIdOrThrow(), shareCode),
            cancellationToken);

        if (!result.Success || result.Data is null)
        {
            return Ok(result);
        }

        return Ok(ApiResponse<CommunityLessonDto>.Ok(
            MapMediaUrls(result.Data),
            result.Message));
    }
}
