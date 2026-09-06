using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.PredefinedMemoryLessons.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.PredefinedMemoryLessons.Admin.Queries;

public sealed record GetPredefinedMemoryLessonsQuery
    : IRequest<ApiResponse<IReadOnlyList<PredefinedMemoryLessonDto>>>;

public sealed class GetPredefinedMemoryLessonsQueryHandler(IAppDbContext db)
    : IRequestHandler<GetPredefinedMemoryLessonsQuery, ApiResponse<IReadOnlyList<PredefinedMemoryLessonDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<PredefinedMemoryLessonDto>>> Handle(
        GetPredefinedMemoryLessonsQuery request,
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
