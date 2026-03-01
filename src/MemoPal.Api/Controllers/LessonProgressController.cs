using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Features.LessonProgress.Commands;
using MemoPal.Application.Features.LessonProgress.DTOs;
using MemoPal.Application.Features.LessonProgress.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
public sealed class LessonProgressController : ApiControllerBase
{
    public LessonProgressController(ISender sender) : base(sender)
    {
    }

    [HttpGet("/lessons/{lessonId}/progress")]
    public async Task<ActionResult<ApiResponse<LessonProgressDto>>> GetProgress(string lessonId, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetLessonProgressQuery(GetUserIdOrThrow(), lessonId), cancellationToken);
        return Ok(ApiResponse<LessonProgressDto>.Ok(data));
    }

    [HttpPut("/lessons/{lessonId}/progress")]
    public async Task<ActionResult<ApiResponse<LessonProgressDto>>> UpdateProgress(string lessonId, [FromBody] LessonProgressUpsertRequest request, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new UpdateLessonProgressCommand(GetUserIdOrThrow(), lessonId, request), cancellationToken);
        return Ok(ApiResponse<LessonProgressDto>.Ok(data));
    }

    [HttpPost("/lessons/progress/batch")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<LessonProgressDto>>>> SyncBatch([FromBody] ProgressBatchRequest request, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new SyncLessonProgressBatchCommand(GetUserIdOrThrow(), request.Data), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<LessonProgressDto>>.Ok(data));
    }

    [HttpGet("/lessons/progress/updated")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<LessonProgressDto>>>> GetUpdated([FromQuery] DateTime since, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetUpdatedLessonProgressQuery(GetUserIdOrThrow(), since), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<LessonProgressDto>>.Ok(data));
    }
}
