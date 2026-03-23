using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Configs.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Configs.Queries;

public sealed record GetLevelConfigsQuery() : IRequest<ApiResponse<IReadOnlyList<LevelConfigDto>>>;

public sealed class GetLevelConfigsQueryHandler : IRequestHandler<GetLevelConfigsQuery, ApiResponse<IReadOnlyList<LevelConfigDto>>>
{
    private readonly IAppDbContext _db;

    public GetLevelConfigsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<LevelConfigDto>>> Handle(GetLevelConfigsQuery request, CancellationToken cancellationToken)
    {
        var data = await _db.LevelConfigs
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.Level)
            .ToListAsync(cancellationToken);
        var items = data.Select(x => x.Adapt<LevelConfigDto>()).ToList();
        return ApiResponse<IReadOnlyList<LevelConfigDto>>.Ok(items);
    }
}

