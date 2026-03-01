using Mapster;
using MediatR;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.LessonProgress.DTOs;
using MemoPal.Application.Features.Reviews.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.LessonProgress.Queries;

public sealed record GetUpdatedLessonProgressQuery(string UserId, DateTime Since) : IRequest<IReadOnlyList<LessonProgressDto>>;

public sealed class GetUpdatedLessonProgressQueryHandler : IRequestHandler<GetUpdatedLessonProgressQuery, IReadOnlyList<LessonProgressDto>>
{
    private readonly IAppDbContext _db;

    public GetUpdatedLessonProgressQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<LessonProgressDto>> Handle(GetUpdatedLessonProgressQuery request, CancellationToken cancellationToken)
    {
        var progresses = await _db.LessonProgresses
            .Where(x => x.UserId == request.UserId && x.UpdatedAt > request.Since)
            .OrderBy(x => x.UpdatedAt)
            .ToListAsync(cancellationToken);

        var progressIds = progresses.Select(x => x.Id).ToList();
        var schedules = await _db.ReviewSchedules
            .Where(x => x.UserId == request.UserId && progressIds.Contains(x.LessonProgressId) && !x.IsDeleted)
            .ToListAsync(cancellationToken);

        var grouped = schedules
            .GroupBy(x => x.LessonProgressId)
            .ToDictionary(
                x => x.Key,
                x => (IReadOnlyList<ReviewScheduleDto>)x.OrderBy(y => y.ReviewRound).Select(y => y.Adapt<ReviewScheduleDto>()).ToList());

        return progresses
            .Select(p =>
            {
                grouped.TryGetValue(p.Id, out var value);
                value ??= [];
                return (p, value).Adapt<LessonProgressDto>();
            })
            .ToList();
    }
}

