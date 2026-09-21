using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.PredefinedMemoryLessons.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.PredefinedMemoryLessons.Queries;

public sealed record GetPublishedPredefinedMemoryLessonsQuery
    : IRequest<ApiResponse<IReadOnlyList<PredefinedMemoryLessonDto>>>;
public sealed record GetPagedPublishedPredefinedMemoryLessonsQuery(int PageNumber = 1, int PageSize = 12)
    : IRequest<PaginatedResponse<PredefinedMemoryLessonDto>>;

public sealed class GetPublishedPredefinedMemoryLessonsQueryHandler(IAppDbContext db)
    : IRequestHandler<GetPublishedPredefinedMemoryLessonsQuery, ApiResponse<IReadOnlyList<PredefinedMemoryLessonDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<PredefinedMemoryLessonDto>>> Handle(
        GetPublishedPredefinedMemoryLessonsQuery request,
        CancellationToken cancellationToken)
    {
        var lessons = await db.PredefinedMemoryLessons.AsNoTracking()
            .Include(x => x.Items.Where(item => !item.IsDeleted))
            .Include(x => x.Category)
            .Where(AvailableLessonPredicate())
            .OrderBy(x => x.Category.SortOrder)
            .ThenBy(x => x.SortOrder)
            .ThenBy(x => x.TitleEn)
            .ToListAsync(cancellationToken);
        return ApiResponse<IReadOnlyList<PredefinedMemoryLessonDto>>.Ok(
            lessons.Select(PredefinedMemoryLessonMapper.ToDto).ToList());
    }

    private static System.Linq.Expressions.Expression<Func<PredefinedMemoryLesson, bool>> AvailableLessonPredicate() =>
        x => !x.IsDeleted && x.IsPublished && !x.Category.IsDeleted && x.Category.IsActive
            && (x.TechniqueKey != MemoryTechniqueKeys.Palace || x.PalaceSceneId != null)
            && x.Items.Where(item => !item.IsDeleted)
                .All(item => item.AssociationEn != "" && item.AssociationZh != "");
}

public sealed class GetPagedPublishedPredefinedMemoryLessonsQueryHandler(IAppDbContext db)
    : IRequestHandler<GetPagedPublishedPredefinedMemoryLessonsQuery, PaginatedResponse<PredefinedMemoryLessonDto>>
{
    public async Task<PaginatedResponse<PredefinedMemoryLessonDto>> Handle(
        GetPagedPublishedPredefinedMemoryLessonsQuery request, CancellationToken cancellationToken)
    {
        var pageNumber = Math.Max(1, request.PageNumber);
        var pageSize = Math.Clamp(request.PageSize, 1, 50);
        var query = db.PredefinedMemoryLessons.AsNoTracking()
            .Include(x => x.Items.Where(item => !item.IsDeleted))
            .Include(x => x.Category)
            .Where(AvailableLessonPredicate())
            .OrderBy(x => x.Category.SortOrder).ThenBy(x => x.SortOrder).ThenBy(x => x.TitleEn);
        var totalCount = await query.CountAsync(cancellationToken);
        var lessons = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        return PaginatedResponse<PredefinedMemoryLessonDto>.Ok(
            lessons.Select(PredefinedMemoryLessonMapper.ToDto).ToList(), pageNumber, pageSize, totalCount);
    }

    private static System.Linq.Expressions.Expression<Func<PredefinedMemoryLesson, bool>> AvailableLessonPredicate() =>
        x => !x.IsDeleted && x.IsPublished && !x.Category.IsDeleted && x.Category.IsActive
            && (x.TechniqueKey != MemoryTechniqueKeys.Palace || x.PalaceSceneId != null)
            && x.Items.Where(item => !item.IsDeleted)
                .All(item => item.AssociationEn != "" && item.AssociationZh != "");
}
