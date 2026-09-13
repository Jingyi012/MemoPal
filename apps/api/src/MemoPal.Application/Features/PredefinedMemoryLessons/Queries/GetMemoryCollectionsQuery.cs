using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.PredefinedMemoryLessons.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.PredefinedMemoryLessons.Queries;

public sealed record GetMemoryCollectionsQuery(bool PublishedOnly) : IRequest<ApiResponse<IReadOnlyList<PredefinedMemoryCollectionDto>>>;

public sealed class GetMemoryCollectionsQueryHandler(IAppDbContext db)
    : IRequestHandler<GetMemoryCollectionsQuery, ApiResponse<IReadOnlyList<PredefinedMemoryCollectionDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<PredefinedMemoryCollectionDto>>> Handle(GetMemoryCollectionsQuery request, CancellationToken ct)
    {
        var query = db.PredefinedMemoryCollections.AsNoTracking().Where(x => !x.IsDeleted);
        if (request.PublishedOnly)
            query = query.Where(x => x.IsPublished && !x.Category.IsDeleted && x.Category.IsActive);
        var entities = await query.WithLessons().OrderBy(x => x.SortOrder).ThenBy(x => x.Id).ToListAsync(ct);
        var result = entities.Select(x => PredefinedMemoryCollectionQuery.ToDto(x, request.PublishedOnly))
            .Where(x => !request.PublishedOnly || x.Lessons.Count > 0).ToList();
        return ApiResponse<IReadOnlyList<PredefinedMemoryCollectionDto>>.Ok(result);
    }
}
