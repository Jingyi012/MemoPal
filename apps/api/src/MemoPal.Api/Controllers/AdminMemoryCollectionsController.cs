using MediatR;
using MemoPal.Application.Features.PredefinedMemoryLessons.Commands;
using MemoPal.Application.Features.PredefinedMemoryLessons.DTOs;
using MemoPal.Application.Features.PredefinedMemoryLessons.Queries;
using MemoPal.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize(Roles = UserRoles.Admin)]
[Route("admin/memory-collections")]
public sealed class AdminMemoryCollectionsController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct) =>
        Ok(await Sender.Send(new GetMemoryCollectionsQuery(false), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PredefinedMemoryCollectionRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new SaveMemoryCollectionCommand(null, request), ct));

    [HttpPut("{collectionId}")]
    public async Task<IActionResult> Update(string collectionId, [FromBody] PredefinedMemoryCollectionRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new SaveMemoryCollectionCommand(collectionId, request), ct));
}
