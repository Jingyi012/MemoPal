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
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await Sender.Send(
            new GetMemoryFoldersQuery(GetUserIdOrThrow()), cancellationToken));
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] MemoryFolderRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await Sender.Send(
            new CreateMemoryFolderCommand(GetUserIdOrThrow(), request), cancellationToken));
    }

    [HttpPatch("{folderId}")]
    public async Task<IActionResult> Rename(
        string folderId,
        [FromBody] MemoryFolderRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await Sender.Send(
            new RenameMemoryFolderCommand(GetUserIdOrThrow(), folderId, request), cancellationToken));
    }

    [HttpDelete("{folderId}")]
    public async Task<IActionResult> Delete(string folderId, CancellationToken cancellationToken)
    {
        return Ok(await Sender.Send(
            new DeleteMemoryFolderCommand(GetUserIdOrThrow(), folderId), cancellationToken));
    }
}
