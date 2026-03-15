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
        var query = _db.ReviewSchedules.Where(x => x.UserId == request.UserId && !x.IsDeleted);
        var total = await query.CountAsync(cancellationToken);
        var completed = await query.CountAsync(x => x.Completed, cancellationToken);
        var pending = await query.CountAsync(x => !x.Completed, cancellationToken);
        var due = await query.CountAsync(x => !x.Completed && x.DueDate <= now, cancellationToken);
        return ApiResponse<ReviewStatsDto>.Ok(new ReviewStatsDto(total, completed, pending, due));
    }
}




