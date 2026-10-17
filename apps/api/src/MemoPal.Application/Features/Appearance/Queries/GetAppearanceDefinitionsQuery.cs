using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Appearance.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Appearance.Queries;

public sealed record GetAppearanceDefinitionsQuery : IRequest<ApiResponse<IReadOnlyList<AppearanceDefinitionDto>>>;

public sealed class GetAppearanceDefinitionsQueryHandler(IAppDbContext db)
    : IRequestHandler<GetAppearanceDefinitionsQuery, ApiResponse<IReadOnlyList<AppearanceDefinitionDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<AppearanceDefinitionDto>>> Handle(
        GetAppearanceDefinitionsQuery request,
        CancellationToken cancellationToken)
    {
        var entities = await db.AppearanceDefinitions
            .AsNoTracking()
            .Where(x => !x.IsDeleted && x.IsActive)
            .OrderBy(x => x.ItemType)
            .ThenBy(x => x.SortOrder)
            .ThenBy(x => x.RequiredLevel)
            .ThenBy(x => x.Key)
            .ToListAsync(cancellationToken);

        return ApiResponse<IReadOnlyList<AppearanceDefinitionDto>>.Ok(
            entities.Select(x => x.Adapt<AppearanceDefinitionDto>()).ToList());
    }
}
