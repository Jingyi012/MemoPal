using Mapster;
using MediatR;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Configs.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Configs.Queries;

public sealed record GetLevelConfigsQuery() : IRequest<IReadOnlyList<LevelConfigDto>>;

public sealed class GetLevelConfigsQueryHandler : IRequestHandler<GetLevelConfigsQuery, IReadOnlyList<LevelConfigDto>>
{
    private readonly IAppDbContext _db;

    public GetLevelConfigsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<LevelConfigDto>> Handle(GetLevelConfigsQuery request, CancellationToken cancellationToken)
    {
        var data = await _db.LevelConfigs
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.Level)
            .ToListAsync(cancellationToken);
        return data.Select(x => x.Adapt<LevelConfigDto>()).ToList();
    }
}

