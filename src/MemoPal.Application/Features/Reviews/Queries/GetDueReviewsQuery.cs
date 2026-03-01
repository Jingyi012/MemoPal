using Mapster;
using MediatR;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Reviews.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Reviews.Queries;

public sealed record GetDueReviewsQuery(string UserId) : IRequest<IReadOnlyList<ReviewScheduleDto>>;

public sealed class GetDueReviewsQueryHandler : IRequestHandler<GetDueReviewsQuery, IReadOnlyList<ReviewScheduleDto>>
{
    private readonly IAppDbContext _db;

    public GetDueReviewsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<ReviewScheduleDto>> Handle(GetDueReviewsQuery request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var data = await _db.ReviewSchedules
            .Where(x => x.UserId == request.UserId && !x.IsDeleted && !x.Completed && x.DueDate <= now)
            .OrderBy(x => x.DueDate)
            .ToListAsync(cancellationToken);

        return data.Select(x => x.Adapt<ReviewScheduleDto>()).ToList();
    }
}

