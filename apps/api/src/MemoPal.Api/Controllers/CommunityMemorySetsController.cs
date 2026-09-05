using MediatR;
using MemoPal.Application.Features.CommunityMemorySets.Commands;
using MemoPal.Application.Features.CommunityMemorySets.DTOs;
using MemoPal.Application.Features.CommunityMemorySets.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
[Route("v2/community/memory-sets")]
public sealed class CommunityMemorySetsController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? techniqueKey,
        [FromQuery] string? goalType,
        [FromQuery] string? sort = "newest",
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await Sender.Send(new GetCommunityMemorySetsQuery(
            GetUserIdOrThrow(), search, techniqueKey, goalType, sort, pageNumber, pageSize), cancellationToken));

    [HttpGet("{memorySetId}")]
    public async Task<IActionResult> GetById(string memorySetId, CancellationToken cancellationToken) =>
        Ok(await Sender.Send(new GetCommunityMemorySetQuery(GetUserIdOrThrow(), memorySetId), cancellationToken));

    [HttpPost("{memorySetId}/copy")]
    public async Task<IActionResult> Copy(string memorySetId, CancellationToken cancellationToken) =>
        Ok(await Sender.Send(new CopyCommunityMemorySetCommand(GetUserIdOrThrow(), memorySetId), cancellationToken));

    [HttpPost("{memorySetId}/reports")]
    public async Task<IActionResult> Report(
        string memorySetId,
        [FromBody] ReportMemorySetRequest request,
        CancellationToken cancellationToken) =>
        Ok(await Sender.Send(new ReportCommunityMemorySetCommand(
            GetUserIdOrThrow(), memorySetId, request), cancellationToken));
}
