using MemoPal.Api.Security;
using MediatR;
using MemoPal.Application.Features.MemoryFolders.Commands;
using MemoPal.Application.Features.MemoryFolders.DTOs;
using MemoPal.Application.Features.MemoryFolders.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
[Route("v1/memory-folders")]
public sealed class MemoryFoldersController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet]
    [RestrictedLearner(RestrictedLearnerAccess.Conditional)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await Sender.Send(
            new GetMemoryFoldersQuery(GetUserIdOrThrow()), cancellationToken));
    }

    [HttpPost]
    [RestrictedLearner(RestrictedLearnerAccess.Conditional)]
    public async Task<IActionResult> Create(
        [FromBody] MemoryFolderRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await Sender.Send(
            new CreateMemoryFolderCommand(GetUserIdOrThrow(), request), cancellationToken));
    }

    [HttpPatch("{folderId}")]
    [RestrictedLearner(RestrictedLearnerAccess.Conditional)]
    public async Task<IActionResult> Rename(
        string folderId,
        [FromBody] MemoryFolderRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await Sender.Send(
            new RenameMemoryFolderCommand(GetUserIdOrThrow(), folderId, request), cancellationToken));
    }

    [HttpDelete("{folderId}")]
    [RestrictedLearner(RestrictedLearnerAccess.Conditional)]
    public async Task<IActionResult> Delete(string folderId, CancellationToken cancellationToken)
    {
        return Ok(await Sender.Send(
            new DeleteMemoryFolderCommand(GetUserIdOrThrow(), folderId), cancellationToken));
    }
}
