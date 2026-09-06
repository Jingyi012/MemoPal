using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.PredefinedMemoryLessons.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.PredefinedMemoryLessons.Admin.Queries;

public sealed record GetPredefinedMemoryLessonCategoriesQuery
    : IRequest<ApiResponse<IReadOnlyList<PredefinedMemoryLessonCategoryDto>>>;

public sealed class GetPredefinedMemoryLessonCategoriesQueryHandler(IAppDbContext db)
    : IRequestHandler<GetPredefinedMemoryLessonCategoriesQuery, ApiResponse<IReadOnlyList<PredefinedMemoryLessonCategoryDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<PredefinedMemoryLessonCategoryDto>>> Handle(
        GetPredefinedMemoryLessonCategoriesQuery request,
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
