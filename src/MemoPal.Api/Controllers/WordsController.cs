using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Features.Words.Commands;
using MemoPal.Application.Features.Words.DTOs;
using MemoPal.Application.Features.Words.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
public sealed class WordsController : ApiControllerBase
{
    public WordsController(ISender sender) : base(sender)
    {
    }

    [HttpGet("/words")]
    public async Task<IActionResult> GetByLesson(
        [FromQuery] string lessonId,
        [FromQuery] bool adminCreatedOnly = false,
        CancellationToken cancellationToken = default)
    {
        var data = await Sender.Send(
            new GetWordsByLessonQuery(
                GetUserIdOrThrow(),
                lessonId,
                IsAdmin: IsAdmin(),
                AdminCreatedOnly: adminCreatedOnly),
            cancellationToken);
        return Ok(data);
    }

    [HttpGet("/words/{wordId}")]
    public async Task<IActionResult> GetById(
        string wordId,
        [FromQuery] bool adminCreatedOnly = false,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(
            new GetWordQuery(GetUserIdOrThrow(), wordId, IsAdmin(), adminCreatedOnly),
            cancellationToken);
        return Ok(result);
    }

    [HttpPost("/words")]
    public async Task<IActionResult> Create([FromBody] WordUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new CreateWordCommand(GetUserIdOrThrow(), request, IsAdmin()), cancellationToken); return Ok(result);
    }

    [HttpPost("/words/batch")]
    public async Task<IActionResult> CreateBatch([FromBody] IReadOnlyList<WordUpsertRequest> requests, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new CreateWordsBatchCommand(GetUserIdOrThrow(), requests, IsAdmin()), cancellationToken);
        return Ok(data);
    }

    [HttpPatch("/words/{wordId}")]
    public async Task<IActionResult> Update(string wordId, [FromBody] WordUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpdateWordCommand(GetUserIdOrThrow(), wordId, request, IsAdmin()), cancellationToken); return Ok(result);
    }

    [HttpPatch("/words/batch")]
    public async Task<IActionResult> UpdateBatch([FromBody] IReadOnlyList<WordUpsertRequest> requests, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new UpdateWordsBatchCommand(GetUserIdOrThrow(), requests, IsAdmin()), cancellationToken);
        return Ok(data);
    }

    [HttpDelete("/words/{wordId}")]
    public async Task<IActionResult> Delete(string wordId, CancellationToken cancellationToken)
    {
        await Sender.Send(new DeleteWordCommand(GetUserIdOrThrow(), wordId, IsAdmin()), cancellationToken);
        return Ok(ApiResponse<object?>.Ok(null));
    }

    [HttpPost("/words/batch/delete")]
    public async Task<IActionResult> DeleteBatch([FromBody] BatchDeleteWordsRequest request, CancellationToken cancellationToken)
    {
        await Sender.Send(new DeleteWordsBatchCommand(GetUserIdOrThrow(), request.Ids, IsAdmin()), cancellationToken);
        return Ok(ApiResponse<object?>.Ok(null));
    }

}


