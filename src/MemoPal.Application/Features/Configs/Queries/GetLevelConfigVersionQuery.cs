using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Configs.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Configs.Queries;

public sealed record GetLevelConfigVersionQuery() : IRequest<ApiResponse<LevelConfigVersionDto>>;

public sealed class GetLevelConfigVersionQueryHandler
    : IRequestHandler<GetLevelConfigVersionQuery, ApiResponse<LevelConfigVersionDto>>
{
    private readonly IAppDbContext _db;

    public GetLevelConfigVersionQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<LevelConfigVersionDto>> Handle(GetLevelConfigVersionQuery request, CancellationToken cancellationToken)
    {
        var summary = await _db.LevelConfigs
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                ActiveCount = g.Count(),
                LatestUpdatedAt = g.Max(x => (DateTime?)x.UpdatedAt)
            })
            .FirstOrDefaultAsync(cancellationToken);

        var activeCount = summary?.ActiveCount ?? 0;
        var latestUpdatedAt = summary?.LatestUpdatedAt;
        var version = $"{activeCount}:{latestUpdatedAt?.Ticks ?? 0}";

        return ApiResponse<LevelConfigVersionDto>.Ok(
            new LevelConfigVersionDto(
                version,
                latestUpdatedAt,
                activeCount));
    }
}
