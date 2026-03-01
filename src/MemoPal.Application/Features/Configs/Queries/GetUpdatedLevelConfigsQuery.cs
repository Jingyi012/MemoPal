using Mapster;
using MediatR;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Configs.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Configs.Queries;

public sealed record GetUpdatedLevelConfigsQuery(DateTime Since) : IRequest<IReadOnlyList<LevelConfigDto>>;

public sealed class GetUpdatedLevelConfigsQueryHandler : IRequestHandler<GetUpdatedLevelConfigsQuery, IReadOnlyList<LevelConfigDto>>
{
    private readonly IAppDbContext _db;

    public GetUpdatedLevelConfigsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<LevelConfigDto>> Handle(GetUpdatedLevelConfigsQuery request, CancellationToken cancellationToken)
    {
        var data = await _db.LevelConfigs
            .Where(x => x.UpdatedAt > request.Since)
            .OrderBy(x => x.UpdatedAt)
            .ToListAsync(cancellationToken);
        return data.Select(x => x.Adapt<LevelConfigDto>()).ToList();
    }
}

