using MemoPal.Api.Security;
using MediatR;
using MemoPal.Application.Features.MemorySets.Commands;
using MemoPal.Application.Features.MemorySets.DTOs;
using MemoPal.Application.Features.MemorySets.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MemoPal.Application.Features.CommunityMemorySets.Commands;
using MemoPal.Application.Features.CommunityMemorySets.DTOs;
using MemoPal.Application.Features.MemoryFolders.DTOs;

namespace MemoPal.Api.Controllers;

[Authorize]
[Route("v1/memory-sets")]
public sealed class MemorySetsController : ApiControllerBase
{
    public MemorySetsController(ISender sender) : base(sender)
    {
    }

    [HttpGet]
    [RestrictedLearner(RestrictedLearnerAccess.Conditional)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? folderId = null,
        [FromQuery] bool unfiled = false,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(
            new GetPagedMemorySetsQuery(GetUserIdOrThrow(), pageNumber, pageSize, folderId, unfiled),
            cancellationToken);
        return Ok(result);
    }

    [HttpGet("{memorySetId}")]
    [RestrictedLearner(RestrictedLearnerAccess.Conditional)]
    public async Task<IActionResult> GetById(string memorySetId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new GetMemorySetQuery(GetUserIdOrThrow(), memorySetId),
            cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [RestrictedLearner(RestrictedLearnerAccess.Conditional)]
    public async Task<IActionResult> Create(
        [FromBody] MemorySetUpsertRequest request,
        CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new CreateMemorySetCommand(GetUserIdOrThrow(), request),
            cancellationToken);
        return Ok(result);
    }

    [HttpPut("{memorySetId}")]
    [RestrictedLearner(RestrictedLearnerAccess.Conditional)]
    public async Task<IActionResult> Update(
        string memorySetId,
        [FromBody] MemorySetUpsertRequest request,
        CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new UpdateMemorySetCommand(GetUserIdOrThrow(), memorySetId, request),
            cancellationToken);
        return Ok(result);
    }

    [HttpPost("{memorySetId}/duplicate")]
    [RestrictedLearner(RestrictedLearnerAccess.Conditional)]
    public async Task<IActionResult> Duplicate(string memorySetId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new DuplicateMemorySetCommand(GetUserIdOrThrow(), memorySetId),
            cancellationToken);
        return Ok(result);
    }

    [HttpPatch("{memorySetId}/folder")]
    [RestrictedLearner(RestrictedLearnerAccess.Conditional)]
    public async Task<IActionResult> MoveToFolder(
        string memorySetId,
        [FromBody] MoveMemorySetToFolderRequest request,
        CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new MoveMemorySetToFolderCommand(GetUserIdOrThrow(), memorySetId, request),
            cancellationToken);
        return Ok(result);
    }

    [HttpPatch("{memorySetId}/visibility")]
    [RestrictedLearner(RestrictedLearnerAccess.Conditional)]
    public async Task<IActionResult> UpdateVisibility(
        string memorySetId,
        [FromBody] UpdateMemorySetVisibilityRequest request,
        CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new UpdateMemorySetVisibilityCommand(
                GetUserIdOrThrow(), memorySetId, request.Visibility, request.ConfirmPrivateAssets),
            cancellationToken);
        return Ok(result);
    }

    [HttpPatch("{memorySetId}/archive")]
    [RestrictedLearner(RestrictedLearnerAccess.Conditional)]
    public async Task<IActionResult> Archive(string memorySetId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new SetMemorySetArchivedCommand(GetUserIdOrThrow(), memorySetId, true),
            cancellationToken);
        return Ok(result);
    }

    [HttpPatch("{memorySetId}/restore")]
    [RestrictedLearner(RestrictedLearnerAccess.Conditional)]
    public async Task<IActionResult> Restore(string memorySetId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new SetMemorySetArchivedCommand(GetUserIdOrThrow(), memorySetId, false),
            cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{memorySetId}")]
    [RestrictedLearner(RestrictedLearnerAccess.Conditional)]
    public async Task<IActionResult> Delete(string memorySetId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new DeleteMemorySetCommand(GetUserIdOrThrow(), memorySetId),
            cancellationToken);
        return Ok(result);
    }
}
