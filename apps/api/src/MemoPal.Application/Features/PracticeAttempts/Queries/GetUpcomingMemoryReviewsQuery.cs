using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.PracticeAttempts.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.PracticeAttempts.Queries;

public sealed record GetUpcomingMemoryReviewsQuery(string UserId, int Days = 30)
    : IRequest<ApiResponse<IReadOnlyList<DueMemoryReviewDto>>>;

public sealed class GetUpcomingMemoryReviewsQueryHandler
    : IRequestHandler<GetUpcomingMemoryReviewsQuery, ApiResponse<IReadOnlyList<DueMemoryReviewDto>>>
{
    private readonly IAppDbContext _db;

    public GetUpcomingMemoryReviewsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<DueMemoryReviewDto>>> Handle(
        GetUpcomingMemoryReviewsQuery request,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var until = now.AddDays(Math.Clamp(request.Days, 1, 90));
        var items = await (
            from schedule in _db.MemoryReviewSchedules.AsNoTracking()
            join memoryItem in _db.MemoryItems.AsNoTracking() on schedule.MemoryItemId equals memoryItem.Id
            join memorySet in _db.MemorySets.AsNoTracking() on schedule.MemorySetId equals memorySet.Id
            where schedule.UserId == request.UserId &&
                  !schedule.IsDeleted && schedule.DueAt > now && schedule.DueAt <= until &&
                  !memoryItem.IsDeleted && !memorySet.IsDeleted
            orderby schedule.DueAt, memorySet.Title, memoryItem.Position
            select new DueMemoryReviewDto(
                schedule.Id,
                memorySet.Id,
                memorySet.Title,
                memorySet.TechniqueKey,
                memoryItem.Id,
                memoryItem.Position,
                memoryItem.Prompt,
                schedule.DueAt,
                schedule.IntervalDays,
                schedule.ReviewCount,
                schedule.LastResultCorrect,
                schedule.CreatedAt,
                schedule.UpdatedAt,
                schedule.CreatedBy,
                schedule.UpdatedBy))
            .ToListAsync(cancellationToken);

        return ApiResponse<IReadOnlyList<DueMemoryReviewDto>>.Ok(items);
    }
}
