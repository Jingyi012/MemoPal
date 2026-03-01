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
    public async Task<ActionResult<ApiResponse<IReadOnlyList<WordDto>>>> GetByLesson([FromQuery] string lessonId, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetWordsByLessonQuery(GetUserIdOrThrow(), lessonId), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<WordDto>>.Ok(data));
    }

    [HttpGet("/words/{wordId}")]
    public async Task<ActionResult<ApiResponse<WordDto>>> GetById(string wordId, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetWordQuery(GetUserIdOrThrow(), wordId), cancellationToken);
        return Ok(ApiResponse<WordDto>.Ok(data));
    }

    [HttpPost("/words")]
    public async Task<ActionResult<ApiResponse<WordDto>>> Create([FromBody] WordUpsertRequest request, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new CreateWordCommand(GetUserIdOrThrow(), request), cancellationToken);
        return Ok(ApiResponse<WordDto>.Ok(data));
    }

    [HttpPost("/words/batch")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<WordDto>>>> CreateBatch([FromBody] IReadOnlyList<WordUpsertRequest> requests, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new CreateWordsBatchCommand(GetUserIdOrThrow(), requests), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<WordDto>>.Ok(data));
    }

    [HttpPatch("/words/{wordId}")]
    public async Task<ActionResult<ApiResponse<WordDto>>> Update(string wordId, [FromBody] WordUpsertRequest request, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new UpdateWordCommand(GetUserIdOrThrow(), wordId, request), cancellationToken);
        return Ok(ApiResponse<WordDto>.Ok(data));
    }

    [HttpPatch("/words/batch")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<WordDto>>>> UpdateBatch([FromBody] IReadOnlyList<WordUpsertRequest> requests, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new UpdateWordsBatchCommand(GetUserIdOrThrow(), requests), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<WordDto>>.Ok(data));
    }

    [HttpDelete("/words/{wordId}")]
    public async Task<ActionResult<ApiResponse<object?>>> Delete(string wordId, CancellationToken cancellationToken)
    {
        await Sender.Send(new DeleteWordCommand(GetUserIdOrThrow(), wordId), cancellationToken);
        return Ok(ApiResponse<object?>.Ok(null));
    }

    [HttpPost("/words/batch/delete")]
    public async Task<ActionResult<ApiResponse<object?>>> DeleteBatch([FromBody] BatchDeleteWordsRequest request, CancellationToken cancellationToken)
    {
        await Sender.Send(new DeleteWordsBatchCommand(GetUserIdOrThrow(), request.Ids), cancellationToken);
        return Ok(ApiResponse<object?>.Ok(null));
    }

    [HttpGet("/words/updated")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<WordDto>>>> GetUpdated([FromQuery] DateTime since, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetUpdatedWordsQuery(GetUserIdOrThrow(), since), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<WordDto>>.Ok(data));
    }
}
