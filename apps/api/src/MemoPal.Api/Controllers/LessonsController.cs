using MediatR;
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
    public async Task<IActionResult> GetAll(
        [FromQuery] bool adminCreatedOnly = false,
        CancellationToken cancellationToken = default)
    {
        var data = await Sender.Send(
            new GetAllLessonsQuery(GetUserIdOrThrow(), IsAdmin: IsAdmin(), AdminCreatedOnly: adminCreatedOnly),
            cancellationToken);
        return Ok(data);
    }

    [HttpGet("/lessons/{lessonId}")]
    public async Task<IActionResult> GetById(
        string lessonId,
        [FromQuery] bool adminCreatedOnly = false,
        CancellationToken cancellationToken = default)
    {
        var result = await Sender.Send(
            new GetLessonQuery(GetUserIdOrThrow(), lessonId, IsAdmin(), adminCreatedOnly),
            cancellationToken);
        return Ok(result);
    }

    [HttpGet("/palaces/{palaceId}/lessons")]
    public async Task<IActionResult> GetByPalace(
        string palaceId,
        [FromQuery] bool adminCreatedOnly = false,
        CancellationToken cancellationToken = default)
    {
        var data = await Sender.Send(
            new GetLessonsByPalaceQuery(
                GetUserIdOrThrow(),
                palaceId,
                IsAdmin: IsAdmin(),
                AdminCreatedOnly: adminCreatedOnly),
            cancellationToken);
        return Ok(data);
    }

    [HttpPost("/lessons")]
    public async Task<IActionResult> Create([FromBody] LessonUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new CreateLessonCommand(GetUserIdOrThrow(), request, IsAdmin()), cancellationToken);
        return Ok(result);
    }

    [HttpPut("/lessons/{lessonId}")]
    public async Task<IActionResult> Update(string lessonId, [FromBody] LessonUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpdateLessonCommand(GetUserIdOrThrow(), lessonId, request, IsAdmin()), cancellationToken);
        return Ok(result);
    }

    [HttpDelete("/lessons/{lessonId}")]
    public async Task<IActionResult> Delete(string lessonId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new DeleteLessonCommand(GetUserIdOrThrow(), lessonId, IsAdmin()), cancellationToken);
        return Ok(result);
    }

}


