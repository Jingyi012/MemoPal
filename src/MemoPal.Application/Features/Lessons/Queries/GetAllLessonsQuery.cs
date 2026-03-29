using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Lessons.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Lessons.Queries;

public sealed record GetAllLessonsQuery(string UserId, int? PageNumber = null, int? PageSize = null, bool IsAdmin = false) : IRequest<ApiResponse<IReadOnlyList<LessonDto>>>;

public sealed class GetAllLessonsQueryHandler : IRequestHandler<GetAllLessonsQuery, ApiResponse<IReadOnlyList<LessonDto>>>
{
    private readonly IAppDbContext _db;

    public GetAllLessonsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<LessonDto>>> Handle(GetAllLessonsQuery request, CancellationToken cancellationToken)
    {
        var activePalaceIds = _db.Palaces
            .Where(x => !x.IsDeleted)
            .Select(x => x.Id);

        var baseQuery = _db.Lessons
            .Where(x =>
                !x.IsDeleted &&
                activePalaceIds.Contains(x.PalaceId) &&
                (request.IsAdmin || x.IsCustom != true || x.CreatedBy == request.UserId))
            .OrderBy(x => x.CreatedAt)
            .AsQueryable();

        var usePagination = request.PageNumber.HasValue && request.PageSize.HasValue;

        if (!usePagination)
        {
            var lessons = await baseQuery.ToListAsync(cancellationToken);
            var data = lessons.Select(x => x.Adapt<LessonDto>()).ToList();
            return ApiResponse<IReadOnlyList<LessonDto>>.Ok(data);
        }

        var totalCount = await baseQuery.CountAsync(cancellationToken);
        var pageNumber = Math.Max(1, request.PageNumber!.Value);
        var pageSize = Math.Clamp(request.PageSize!.Value, 1, 100);

        var paged = await baseQuery
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = paged.Select(x => x.Adapt<LessonDto>()).ToList();
        return PaginatedResponse<LessonDto>.Ok(items, pageNumber, pageSize, totalCount);
    }
}
