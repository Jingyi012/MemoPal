using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Common;
using MemoPal.Application.Features.Words.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Words.Queries;

public sealed record GetWordsByLessonQuery(
    string UserId,
    string LessonId,
    int? PageNumber = null,
    int? PageSize = null,
    bool IsAdmin = false,
    bool AdminCreatedOnly = false) : IRequest<ApiResponse<IReadOnlyList<WordDto>>>;

public sealed class GetWordsByLessonQueryHandler : IRequestHandler<GetWordsByLessonQuery, ApiResponse<IReadOnlyList<WordDto>>>
{
    private readonly IAppDbContext _db;

    public GetWordsByLessonQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<WordDto>>> Handle(GetWordsByLessonQuery request, CancellationToken cancellationToken)
    {
        var lesson = await _db.Lessons.FirstOrDefaultAsync(
            x => x.Id == request.LessonId &&
                 !x.IsDeleted &&
                 (request.IsAdmin || x.IsCustom != true || x.CreatedBy == request.UserId),
            cancellationToken);
        if (lesson is null) throw new NotFoundAppException("Lesson not found.");

        if (request.IsAdmin && request.AdminCreatedOnly)
        {
            var isLegacyOfficial = string.IsNullOrWhiteSpace(lesson.CreatedBy) && lesson.IsCustom != true;
            var isAdminCreatedLesson = !string.IsNullOrWhiteSpace(lesson.CreatedBy) && await _db.Users
                .AsNoTracking()
                .AnyAsync(
                    x => x.Id == lesson.CreatedBy &&
                         x.Role == UserRoles.Admin &&
                         !x.IsDeleted,
                    cancellationToken);

            if (!isLegacyOfficial && !isAdminCreatedLesson)
            {
                throw new NotFoundAppException("Lesson not found.");
            }
        }

        var wordsByLessonQuery = _db.Words
            .AsNoTracking()
            .Where(word => word.LessonId == request.LessonId && !word.IsDeleted)
            .AsQueryable();

        if (request.IsAdmin && request.AdminCreatedOnly)
        {
            var adminUserIds = _db.Users
                .AsNoTracking()
                .Where(x => x.Role == UserRoles.Admin && !x.IsDeleted)
                .Select(x => x.Id);

            wordsByLessonQuery = wordsByLessonQuery.Where(word =>
                (word.CreatedBy != null && adminUserIds.Contains(word.CreatedBy)) ||
                word.CreatedBy == null ||
                word.CreatedBy == string.Empty);
        }

        var query =
            from word in wordsByLessonQuery
            join location in _db.Locations.Where(x => !x.IsDeleted)
                on word.LocationId equals location.Id into locationJoin
            from location in locationJoin.DefaultIfEmpty()
            orderby (location == null ? int.MaxValue : location.Position), word.CreatedAt
            select word;

        var usePagination = request.PageNumber.HasValue && request.PageSize.HasValue;
        if (!usePagination)
        {
            var words = await query.ToListAsync(cancellationToken);
            return ApiResponse<IReadOnlyList<WordDto>>.Ok(words.Select(x => x.Adapt<WordDto>()).ToList());
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var pageNumber = Math.Max(1, request.PageNumber!.Value);
        var pageSize = Math.Clamp(request.PageSize!.Value, 1, 100);
        var paged = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);

        return PaginatedResponse<WordDto>.Ok(paged.Select(x => x.Adapt<WordDto>()).ToList(), pageNumber, pageSize, totalCount);
    }
}
