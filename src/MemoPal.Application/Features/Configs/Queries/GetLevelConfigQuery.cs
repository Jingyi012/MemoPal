using Mapster;
using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Configs.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Configs.Queries;

public sealed record GetLevelConfigQuery(int Level) : IRequest<LevelConfigDto>;

public sealed class GetLevelConfigQueryHandler : IRequestHandler<GetLevelConfigQuery, LevelConfigDto>
{
    private readonly IAppDbContext _db;

    public GetLevelConfigQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<LevelConfigDto> Handle(GetLevelConfigQuery request, CancellationToken cancellationToken)
    {
        var config = await _db.LevelConfigs.FirstOrDefaultAsync(x => x.Level == request.Level && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("Level config not found.");
        return config.Adapt<LevelConfigDto>();
    }
}

