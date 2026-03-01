using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Features.Lessons.Commands;
using MemoPal.Application.Features.Lessons.DTOs;
using MemoPal.Application.Features.Lessons.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
public sealed class LessonsController : ApiControllerBase
{
    public LessonsController(ISender sender) : base(sender)
    {
    }

    [HttpGet("/lessons")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<LessonDto>>>> GetAll(CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetAllLessonsQuery(GetUserIdOrThrow()), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<LessonDto>>.Ok(data));
    }

    [HttpGet("/lessons/{lessonId}")]
    public async Task<ActionResult<ApiResponse<LessonDto>>> GetById(string lessonId, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetLessonQuery(GetUserIdOrThrow(), lessonId), cancellationToken);
        return Ok(ApiResponse<LessonDto>.Ok(data));
    }

    [HttpGet("/palaces/{palaceId}/lessons")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<LessonDto>>>> GetByPalace(string palaceId, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetLessonsByPalaceQuery(GetUserIdOrThrow(), palaceId), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<LessonDto>>.Ok(data));
    }

    [HttpPost("/lessons")]
    public async Task<ActionResult<ApiResponse<LessonDto>>> Create([FromBody] LessonUpsertRequest request, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new CreateLessonCommand(GetUserIdOrThrow(), request), cancellationToken);
        return Ok(ApiResponse<LessonDto>.Ok(data));
    }

    [HttpPut("/lessons/{lessonId}")]
    public async Task<ActionResult<ApiResponse<LessonDto>>> Update(string lessonId, [FromBody] LessonUpsertRequest request, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new UpdateLessonCommand(GetUserIdOrThrow(), lessonId, request), cancellationToken);
        return Ok(ApiResponse<LessonDto>.Ok(data));
    }

    [HttpDelete("/lessons/{lessonId}")]
    public async Task<ActionResult<ApiResponse<object?>>> Delete(string lessonId, CancellationToken cancellationToken)
    {
        await Sender.Send(new DeleteLessonCommand(GetUserIdOrThrow(), lessonId), cancellationToken);
        return Ok(ApiResponse<object?>.Ok(null));
    }

    [HttpGet("/lessons/updated")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<LessonDto>>>> GetUpdated([FromQuery] DateTime since, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetUpdatedLessonsQuery(GetUserIdOrThrow(), since), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<LessonDto>>.Ok(data));
    }
}
