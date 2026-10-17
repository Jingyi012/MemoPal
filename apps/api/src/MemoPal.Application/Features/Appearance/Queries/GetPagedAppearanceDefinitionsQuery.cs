using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Appearance.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Appearance.Queries;

public sealed record GetPagedAppearanceDefinitionsQuery(int PageNumber = 1, int PageSize = 20, string? Search = null)
    : IRequest<PaginatedResponse<AppearanceDefinitionDto>>;

public sealed class GetPagedAppearanceDefinitionsQueryHandler(IAppDbContext db)
    : IRequestHandler<GetPagedAppearanceDefinitionsQuery, PaginatedResponse<AppearanceDefinitionDto>>
{
    public async Task<PaginatedResponse<AppearanceDefinitionDto>> Handle(
        GetPagedAppearanceDefinitionsQuery request,
        CancellationToken cancellationToken)
    {
        var pageNumber = Math.Max(1, request.PageNumber);
        var pageSize = Math.Clamp(request.PageSize, 1, 200);
        var query = db.AppearanceDefinitions.Where(x => !x.IsDeleted).AsNoTracking();
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(x => x.Key.Contains(search) || x.TitleEn.Contains(search) || x.TitleZh.Contains(search));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var entities = await query
            .OrderBy(x => x.ItemType)
            .ThenBy(x => x.SortOrder)
            .ThenBy(x => x.RequiredLevel)
            .ThenBy(x => x.Key)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return PaginatedResponse<AppearanceDefinitionDto>.Ok(
            entities.Select(x => x.Adapt<AppearanceDefinitionDto>()).ToList(),
            pageNumber,
            pageSize,
            totalCount);
    }
}
