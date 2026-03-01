using Mapster;
using MediatR;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Reviews.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Reviews.Queries;

public sealed record GetUpdatedReviewsQuery(string UserId, DateTime Since) : IRequest<IReadOnlyList<ReviewScheduleDto>>;

public sealed class GetUpdatedReviewsQueryHandler : IRequestHandler<GetUpdatedReviewsQuery, IReadOnlyList<ReviewScheduleDto>>
{
    private readonly IAppDbContext _db;

    public GetUpdatedReviewsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<ReviewScheduleDto>> Handle(GetUpdatedReviewsQuery request, CancellationToken cancellationToken)
    {
        var data = await _db.ReviewSchedules
            .Where(x => x.UserId == request.UserId && x.UpdatedAt > request.Since)
            .OrderBy(x => x.UpdatedAt)
            .ToListAsync(cancellationToken);
        return data.Select(x => x.Adapt<ReviewScheduleDto>()).ToList();
    }
}

