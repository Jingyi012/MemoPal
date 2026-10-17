using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Avatars.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Avatars.Queries;

public sealed record GetAvatarsQuery : IRequest<ApiResponse<IReadOnlyList<AvatarDefinitionDto>>>;

public sealed class GetAvatarsQueryHandler : IRequestHandler<GetAvatarsQuery, ApiResponse<IReadOnlyList<AvatarDefinitionDto>>>
{
    private readonly IAppDbContext _db;

    public GetAvatarsQueryHandler(IAppDbContext db) => _db = db;

    public async Task<ApiResponse<IReadOnlyList<AvatarDefinitionDto>>> Handle(GetAvatarsQuery request, CancellationToken cancellationToken)
    {
        var entities = await _db.AvatarDefinitions
            .AsNoTracking()
            .Where(x => !x.IsDeleted && x.IsActive)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.RequiredLevel)
            .ThenBy(x => x.Key)
            .ToListAsync(cancellationToken);
        var data = entities.Select(x => x.Adapt<AvatarDefinitionDto>()).ToList();

        return ApiResponse<IReadOnlyList<AvatarDefinitionDto>>.Ok(data);
    }
}
