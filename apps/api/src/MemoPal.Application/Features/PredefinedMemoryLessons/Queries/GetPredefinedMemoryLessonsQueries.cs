using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.PredefinedMemoryLessons.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.PredefinedMemoryLessons.Queries;

public sealed record GetPublishedPredefinedMemoryLessonsQuery
    : IRequest<ApiResponse<IReadOnlyList<PredefinedMemoryLessonDto>>>;
public sealed record GetAdminPredefinedMemoryLessonsQuery
    : IRequest<ApiResponse<IReadOnlyList<PredefinedMemoryLessonDto>>>;

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
            .Where(x => !x.IsDeleted && x.IsPublished && !x.Category.IsDeleted && x.Category.IsActive)
            .OrderBy(x => x.Category.SortOrder)
            .ThenBy(x => x.SortOrder)
            .ThenBy(x => x.TitleEn)
            .ToListAsync(cancellationToken);
        return ApiResponse<IReadOnlyList<PredefinedMemoryLessonDto>>.Ok(
            lessons.Select(PredefinedMemoryLessonMapper.ToDto).ToList());
    }
}

public sealed class GetAdminPredefinedMemoryLessonsQueryHandler(IAppDbContext db)
    : IRequestHandler<GetAdminPredefinedMemoryLessonsQuery, ApiResponse<IReadOnlyList<PredefinedMemoryLessonDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<PredefinedMemoryLessonDto>>> Handle(
        GetAdminPredefinedMemoryLessonsQuery request,
        CancellationToken cancellationToken)
    {
        var lessons = await db.PredefinedMemoryLessons.AsNoTracking()
            .Include(x => x.Items.Where(item => !item.IsDeleted))
            .Include(x => x.Category)
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.TitleEn)
            .ToListAsync(cancellationToken);
        return ApiResponse<IReadOnlyList<PredefinedMemoryLessonDto>>.Ok(
            lessons.Select(PredefinedMemoryLessonMapper.ToDto).ToList());
    }
}
