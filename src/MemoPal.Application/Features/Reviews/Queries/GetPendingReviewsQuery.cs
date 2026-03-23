using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Reviews.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Reviews.Queries;

public sealed record GetPendingReviewsQuery(string UserId) : IRequest<ApiResponse<IReadOnlyList<ReviewScheduleDto>>>;

public sealed class GetPendingReviewsQueryHandler : IRequestHandler<GetPendingReviewsQuery, ApiResponse<IReadOnlyList<ReviewScheduleDto>>>
{
    private readonly IAppDbContext _db;

    public GetPendingReviewsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<ReviewScheduleDto>>> Handle(GetPendingReviewsQuery request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var data = await _db.ReviewSchedules
            .Where(x => x.UserId == request.UserId && !x.IsDeleted && !x.Completed && x.DueDate <= now)
            .OrderBy(x => x.DueDate)
            .ToListAsync(cancellationToken);

        var items = data.Select(x => x.Adapt<ReviewScheduleDto>()).ToList();
        return ApiResponse<IReadOnlyList<ReviewScheduleDto>>.Ok(items);
    }
}

