using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Users.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace MemoPal.Application.Features.Users.Queries;

public sealed record GetManagedUserLessonsQuery(string UserId, int PageNumber = 1, int PageSize = 20, string? PalaceId = null)
    : IRequest<PaginatedResponse<ManagedUserLessonDataDto>>;

public sealed class GetManagedUserLessonsQueryHandler
    : IRequestHandler<GetManagedUserLessonsQuery, PaginatedResponse<ManagedUserLessonDataDto>>
{
    private readonly IAppDbContext _db;

    public GetManagedUserLessonsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<PaginatedResponse<ManagedUserLessonDataDto>> Handle(GetManagedUserLessonsQuery request, CancellationToken cancellationToken)
    {
        await ManagedUserDataQueryHelpers.EnsureUserExistsAsync(_db, request.UserId, cancellationToken);

        var pageNumber = ManagedUserDataQueryHelpers.NormalizePageNumber(request.PageNumber);
        var pageSize = ManagedUserDataQueryHelpers.NormalizePageSize(request.PageSize);

        var query = _db.Lessons
            .AsNoTracking()
            .Where(x => x.CreatedBy == request.UserId);

        if (!string.IsNullOrWhiteSpace(request.PalaceId))
        {
            query = query.Where(x => x.PalaceId == request.PalaceId);
        }

        var baseQuery = query.OrderByDescending(x => x.UpdatedAt);

        var totalCount = await baseQuery.CountAsync(cancellationToken);
        var lessons = await baseQuery
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var lessonIds = lessons.Select(x => x.Id).ToList();
        var words = lessonIds.Count == 0
            ? []
            : await _db.Words
                .AsNoTracking()
                .Where(x => lessonIds.Contains(x.LessonId))
                .OrderByDescending(x => x.UpdatedAt)
                .ToListAsync(cancellationToken);

        var wordsByLessonId = words
            .GroupBy(x => x.LessonId)
            .ToDictionary(
                g => g.Key,
                g => (IReadOnlyList<ManagedUserWordDataDto>)g
                    .Select(x => new ManagedUserWordDataDto(
                        x.Id,
                        x.LessonId,
                        x.LocationId,
                        x.Text,
                        x.Meaning,
                        x.IsDeleted,
                        x.CreatedAt,
                        x.UpdatedAt))
                    .ToList(),
                StringComparer.Ordinal);

        var items = lessons
            .Select(x => new ManagedUserLessonDataDto(
                x.Id,
                x.PalaceId,
                x.Title,
                x.Description,
                x.WordCount,
                x.Category,
                string.IsNullOrWhiteSpace(x.TagJson) ? null : JsonSerializer.Deserialize<string[]>(x.TagJson),
                x.IsCustom,
                x.IsLocked,
                x.Completed,
                x.IsPremium,
                x.Privacy,
                x.CreatedBy,
                x.IsDeleted,
                x.DeletedAt,
                x.CreatedAt,
                x.UpdatedAt,
                wordsByLessonId.GetValueOrDefault(x.Id) ?? []))
            .ToList();

        return PaginatedResponse<ManagedUserLessonDataDto>.Ok(items, pageNumber, pageSize, totalCount);
    }
}
