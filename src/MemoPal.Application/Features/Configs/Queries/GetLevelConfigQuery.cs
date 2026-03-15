using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Configs.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Configs.Queries;

public sealed record GetLevelConfigQuery(int Level) : IRequest<ApiResponse<LevelConfigDto>>;

public sealed class GetLevelConfigQueryHandler : IRequestHandler<GetLevelConfigQuery, ApiResponse<LevelConfigDto>>
{
    private readonly IAppDbContext _db;

    public GetLevelConfigQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<LevelConfigDto>> Handle(GetLevelConfigQuery request, CancellationToken cancellationToken)
    {
        var config = await _db.LevelConfigs.FirstOrDefaultAsync(x => x.Level == request.Level && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("Level config not found.");
        return ApiResponse<LevelConfigDto>.Ok(config.Adapt<LevelConfigDto>());
    }
}




