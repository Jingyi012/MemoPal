using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Features.Reviews.Commands;
using MemoPal.Application.Features.Reviews.DTOs;
using MemoPal.Application.Features.Reviews.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
public sealed class ReviewsController : ApiControllerBase
{
    public ReviewsController(ISender sender) : base(sender)
    {
    }

    [HttpGet("/reviews/pending")]
    public async Task<IActionResult>> GetPending(CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetPendingReviewsQuery(GetUserIdOrThrow()), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<ReviewScheduleDto>>.Ok(data));
    }

    [HttpGet("/lesson-progress/{lessonProgressId}/reviews")]
    public async Task<IActionResult>> GetByProgress(string lessonProgressId, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetReviewsByProgressQuery(GetUserIdOrThrow(), lessonProgressId), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<ReviewScheduleDto>>.Ok(data));
    }

    [HttpGet("/reviews/due")]
    public async Task<IActionResult>> GetDue(CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetDueReviewsQuery(GetUserIdOrThrow()), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<ReviewScheduleDto>>.Ok(data));
    }

    [HttpPatch("/reviews/{reviewId}")]
    public async Task<IActionResult> Update(string reviewId, [FromBody] ReviewScheduleUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpdateReviewCommand(GetUserIdOrThrow(), reviewId, request), cancellationToken);`n        return Ok(result);
    }

    [HttpPost("/reviews/{reviewId}/complete")]
    public async Task<IActionResult> Complete(string reviewId, [FromBody] CompleteReviewRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new CompleteReviewCommand(GetUserIdOrThrow(), reviewId, request.CorrectCount, request.TotalCount), cancellationToken);`n        return Ok(result);
    }

    [HttpGet("/reviews/stats")]
    public async Task<IActionResult> Stats(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetReviewStatsQuery(GetUserIdOrThrow()), cancellationToken);`n        return Ok(result);
    }

    [HttpGet("/reviews/updated")]
    public async Task<IActionResult>> GetUpdated([FromQuery] DateTime since, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetUpdatedReviewsQuery(GetUserIdOrThrow(), since), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<ReviewScheduleDto>>.Ok(data));
    }
}


