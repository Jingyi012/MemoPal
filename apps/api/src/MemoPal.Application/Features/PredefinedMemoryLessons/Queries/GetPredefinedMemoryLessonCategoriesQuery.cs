using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.PredefinedMemoryLessons.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.PredefinedMemoryLessons.Queries;

public sealed record GetAdminPredefinedMemoryLessonCategoriesQuery
    : IRequest<ApiResponse<IReadOnlyList<PredefinedMemoryLessonCategoryDto>>>;

public sealed class GetAdminPredefinedMemoryLessonCategoriesQueryHandler(IAppDbContext db)
    : IRequestHandler<GetAdminPredefinedMemoryLessonCategoriesQuery, ApiResponse<IReadOnlyList<PredefinedMemoryLessonCategoryDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<PredefinedMemoryLessonCategoryDto>>> Handle(
        GetAdminPredefinedMemoryLessonCategoriesQuery request,
        CancellationToken cancellationToken)
    {
        var categories = await db.PredefinedMemoryLessonCategories.AsNoTracking()
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.NameEn)
            .ToListAsync(cancellationToken);
        return ApiResponse<IReadOnlyList<PredefinedMemoryLessonCategoryDto>>.Ok(
            categories.Select(PredefinedMemoryLessonMapper.ToCategoryDto).ToList());
    }
}
