using MediatR;
using MemoPal.Application.Features.PracticeAttempts.Commands;
using MemoPal.Application.Features.PracticeAttempts.DTOs;
using MemoPal.Application.Features.PracticeAttempts.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
[Route("v2/practice-attempts")]
public sealed class PracticeAttemptsController : ApiControllerBase
{
    public PracticeAttemptsController(ISender sender) : base(sender)
    {
    }

    [HttpPost("batch")]
    public async Task<IActionResult> CreateBatch(
        [FromBody] PracticeAttemptBatchRequest request,
        CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new CreatePracticeAttemptBatchCommand(GetUserIdOrThrow(), request),
            cancellationToken);
        return Ok(result);
    }

    [HttpGet("memory-set/{memorySetId}")]
    public async Task<IActionResult> GetHistory(
        string memorySetId,
        CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new GetPracticeAttemptHistoryQuery(GetUserIdOrThrow(), memorySetId),
            cancellationToken);
        return Ok(result);
    }

    [HttpGet("/v2/reviews/due")]
    public async Task<IActionResult> GetDue(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new GetDueMemoryReviewsQuery(GetUserIdOrThrow()),
            cancellationToken);
        return Ok(result);
    }
}
