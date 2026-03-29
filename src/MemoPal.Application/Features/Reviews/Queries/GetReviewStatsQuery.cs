using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Reviews.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Reviews.Queries;

public sealed record GetReviewStatsQuery(string UserId) : IRequest<ApiResponse<ReviewStatsDto>>;

public sealed class GetReviewStatsQueryHandler : IRequestHandler<GetReviewStatsQuery, ApiResponse<ReviewStatsDto>>
{
    private readonly IAppDbContext _db;

    public GetReviewStatsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<ReviewStatsDto>> Handle(GetReviewStatsQuery request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var query =
            from schedule in _db.ReviewSchedules
            join progress in _db.LessonProgresses
                on schedule.LessonProgressId equals progress.Id
            join lesson in _db.Lessons
                on progress.LessonId equals lesson.Id
            where schedule.UserId == request.UserId &&
                  !schedule.IsDeleted &&
                  progress.UserId == request.UserId &&
                  !progress.IsDeleted &&
                  !lesson.IsDeleted
            select schedule;

        var total = await query.CountAsync(cancellationToken);
        var completed = await query.CountAsync(x => x.Completed, cancellationToken);
        var pending = await query.CountAsync(x => !x.Completed, cancellationToken);
        var due = await query.CountAsync(x => !x.Completed && x.DueDate <= now, cancellationToken);
        return ApiResponse<ReviewStatsDto>.Ok(new ReviewStatsDto(total, completed, pending, due));
    }
}




