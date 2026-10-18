using MediatR;
using MemoPal.Api.Controllers;
using MemoPal.Application.Features.Education.Attempts.Commands;
using MemoPal.Application.Features.Education.Attempts.DTOs;
using MemoPal.Application.Features.Education.Attempts.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Net.Http.Headers;

namespace MemoPal.Api.Controllers;

[Authorize]
[Route("v1/education")]
public sealed class EducationAttemptsController(ISender sender) : ApiControllerBase(sender)
{
    [HttpPost("assignments/{assignmentId}/attempts")]
    public async Task<IActionResult> Start(string assignmentId, CancellationToken ct) =>
        Ok(await Sender.Send(new StartEducationAssessmentAttemptCommand(GetUserIdOrThrow(), assignmentId), ct));

    [HttpGet("attempts/{attemptId}")]
    public async Task<IActionResult> Get(string attemptId, CancellationToken ct) =>
        Ok(await Sender.Send(new GetEducationAssessmentAttemptQuery(GetUserIdOrThrow(), attemptId), ct));

    [HttpPut("attempts/{attemptId}/responses")]
    public async Task<IActionResult> Save(string attemptId, [FromBody] SaveEducationAttemptResponseRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new SaveEducationAssessmentResponseCommand(GetUserIdOrThrow(), attemptId, request), ct));

    [HttpPost("attempts/{attemptId}/practice-check")]
    public async Task<IActionResult> CheckPracticeAnswer(string attemptId, [FromBody] EducationPracticeCheckRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new CheckEducationPracticeAnswerCommand(GetUserIdOrThrow(), attemptId, request), ct));

    [HttpGet("practice/items")]
    public async Task<IActionResult> GetPracticeItems(CancellationToken ct) =>
        Ok(await Sender.Send(new GetMyEducationPracticeItemsQuery(GetUserIdOrThrow()), ct));

    [HttpPost("attempts/{attemptId}/responses/{questionId}/photo")]
    [HttpPost("attempts/{attemptId}/responses/{questionId}/audio")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(11_000_000)]
    public async Task<IActionResult> UploadAttachment(string attemptId, string questionId, [FromForm] int expectedVersion,
        [FromForm] IFormFile? file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(MemoPal.Application.Common.ApiResponse<string>.Fail("A response attachment is required."));
        await using var content = file.OpenReadStream();
        var result = await Sender.Send(new UploadEducationResponseAttachmentCommand(GetUserIdOrThrow(), attemptId,
            questionId, expectedVersion, file.Length, file.ContentType, content), ct);
        return Ok(result);
    }

    [HttpGet("attempts/{attemptId}/responses/{questionId}/photos/{attachmentId}")]
    [HttpGet("attempts/{attemptId}/responses/{questionId}/attachments/{attachmentId}")]
    public async Task<IActionResult> GetAttachment(string attemptId, string questionId, string attachmentId, CancellationToken ct)
    {
        var content = await Sender.Send(new GetEducationAttemptAttachmentQuery(GetUserIdOrThrow(), attemptId, questionId, attachmentId), ct);
        Response.Headers[HeaderNames.CacheControl] = "private, no-store";
        return File(content.Content, content.ContentType);
    }

    [HttpPost("attempts/{attemptId}/submit")]
    public async Task<IActionResult> Submit(string attemptId, CancellationToken ct) =>
        Ok(await Sender.Send(new SubmitEducationAssessmentAttemptCommand(GetUserIdOrThrow(), attemptId), ct));
}
