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
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ReviewScheduleDto>>>> GetPending(CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetPendingReviewsQuery(GetUserIdOrThrow()), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<ReviewScheduleDto>>.Ok(data));
    }

    [HttpGet("/lesson-progress/{lessonProgressId}/reviews")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ReviewScheduleDto>>>> GetByProgress(string lessonProgressId, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetReviewsByProgressQuery(GetUserIdOrThrow(), lessonProgressId), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<ReviewScheduleDto>>.Ok(data));
    }

    [HttpGet("/reviews/due")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ReviewScheduleDto>>>> GetDue(CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetDueReviewsQuery(GetUserIdOrThrow()), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<ReviewScheduleDto>>.Ok(data));
    }

    [HttpPatch("/reviews/{reviewId}")]
    public async Task<ActionResult<ApiResponse<ReviewScheduleDto>>> Update(string reviewId, [FromBody] ReviewScheduleUpsertRequest request, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new UpdateReviewCommand(GetUserIdOrThrow(), reviewId, request), cancellationToken);
        return Ok(ApiResponse<ReviewScheduleDto>.Ok(data));
    }

    [HttpPost("/reviews/{reviewId}/complete")]
    public async Task<ActionResult<ApiResponse<ReviewScheduleDto>>> Complete(string reviewId, [FromBody] CompleteReviewRequest request, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new CompleteReviewCommand(GetUserIdOrThrow(), reviewId, request.CorrectCount, request.TotalCount), cancellationToken);
        return Ok(ApiResponse<ReviewScheduleDto>.Ok(data));
    }

    [HttpGet("/reviews/stats")]
    public async Task<ActionResult<ApiResponse<ReviewStatsDto>>> Stats(CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetReviewStatsQuery(GetUserIdOrThrow()), cancellationToken);
        return Ok(ApiResponse<ReviewStatsDto>.Ok(data));
    }

    [HttpGet("/reviews/updated")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ReviewScheduleDto>>>> GetUpdated([FromQuery] DateTime since, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetUpdatedReviewsQuery(GetUserIdOrThrow(), since), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<ReviewScheduleDto>>.Ok(data));
    }
}
