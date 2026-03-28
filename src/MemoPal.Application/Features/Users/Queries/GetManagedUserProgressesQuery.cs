using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Users.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Users.Queries;

public sealed record GetManagedUserProgressesQuery(string UserId, int PageNumber = 1, int PageSize = 20)
    : IRequest<PaginatedResponse<ManagedUserLessonProgressDataDto>>;

public sealed class GetManagedUserProgressesQueryHandler
    : IRequestHandler<GetManagedUserProgressesQuery, PaginatedResponse<ManagedUserLessonProgressDataDto>>
{
    private readonly IAppDbContext _db;

    public GetManagedUserProgressesQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<PaginatedResponse<ManagedUserLessonProgressDataDto>> Handle(GetManagedUserProgressesQuery request, CancellationToken cancellationToken)
    {
        await ManagedUserDataQueryHelpers.EnsureUserExistsAsync(_db, request.UserId, cancellationToken);

        var pageNumber = ManagedUserDataQueryHelpers.NormalizePageNumber(request.PageNumber);
        var pageSize = ManagedUserDataQueryHelpers.NormalizePageSize(request.PageSize);

        var baseQuery = _db.LessonProgresses
            .AsNoTracking()
            .Where(x => x.UserId == request.UserId)
            .OrderByDescending(x => x.UpdatedAt);

        var totalCount = await baseQuery.CountAsync(cancellationToken);
        var progresses = await baseQuery
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var progressIds = progresses.Select(x => x.Id).ToList();
        var schedules = progressIds.Count == 0
            ? []
            : await _db.ReviewSchedules
                .AsNoTracking()
                .Where(x => x.UserId == request.UserId && progressIds.Contains(x.LessonProgressId))
                .OrderBy(x => x.ReviewRound)
                .ThenByDescending(x => x.UpdatedAt)
                .ToListAsync(cancellationToken);

        var progressLessonIds = progresses.Select(x => x.LessonId).Distinct().ToList();
        var lessonTitles = progressLessonIds.Count == 0
            ? new Dictionary<string, string>(StringComparer.Ordinal)
            : await _db.Lessons
                .AsNoTracking()
                .Where(x => progressLessonIds.Contains(x.Id))
                .ToDictionaryAsync(x => x.Id, x => x.Title, cancellationToken);

        var schedulesByProgressId = schedules
            .GroupBy(x => x.LessonProgressId)
            .ToDictionary(
                g => g.Key,
                g => (IReadOnlyList<ManagedUserReviewScheduleDataDto>)g
                    .Select(x => new ManagedUserReviewScheduleDataDto(
                        x.Id,
                        x.LessonProgressId,
                        x.ReviewRound,
                        x.DueDate,
                        x.Completed,
                        x.CompletedDate,
                        x.IsDeleted,
                        x.CreatedAt,
                        x.UpdatedAt))
                    .ToList(),
                StringComparer.Ordinal);

        var items = progresses
            .Select(x => new ManagedUserLessonProgressDataDto(
                x.Id,
                x.LessonId,
                lessonTitles.GetValueOrDefault(x.LessonId) ?? x.LessonId,
                x.FirstCompletedDate,
                x.TotalReviews,
                x.MasteryLevel,
                x.LastReviewDate,
                x.XpEarned,
                x.IsDeleted,
                x.CreatedAt,
                x.UpdatedAt,
                schedulesByProgressId.GetValueOrDefault(x.Id) ?? []))
            .ToList();

        return PaginatedResponse<ManagedUserLessonProgressDataDto>.Ok(items, pageNumber, pageSize, totalCount);
    }
}
