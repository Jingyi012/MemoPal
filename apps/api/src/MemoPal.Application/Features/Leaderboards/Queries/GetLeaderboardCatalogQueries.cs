using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Leaderboards.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Leaderboards.Queries;

public sealed record GetAdminLeaderboardCatalogQuery()
    : IRequest<ApiResponse<LeaderboardCatalogConfigDto>>;

public sealed class GetAdminLeaderboardCatalogQueryHandler(IAppDbContext db)
    : IRequestHandler<GetAdminLeaderboardCatalogQuery, ApiResponse<LeaderboardCatalogConfigDto>>
{
    public async Task<ApiResponse<LeaderboardCatalogConfigDto>> Handle(
        GetAdminLeaderboardCatalogQuery request,
        CancellationToken cancellationToken)
    {
        var rawValue = await db.SystemSettings.AsNoTracking()
            .Where(x => !x.IsDeleted && x.Key == SystemSettingKeys.LeaderboardCatalog)
            .Select(x => x.Value)
            .FirstOrDefaultAsync(cancellationToken);
        return ApiResponse<LeaderboardCatalogConfigDto>.Ok(LeaderboardCatalogSerializer.ParseOrDefault(rawValue));
    }
}

public sealed record GetPublicLeaderboardCatalogQuery()
    : IRequest<ApiResponse<PublicLeaderboardCatalogDto>>;

public sealed class GetPublicLeaderboardCatalogQueryHandler(IAppDbContext db)
    : IRequestHandler<GetPublicLeaderboardCatalogQuery, ApiResponse<PublicLeaderboardCatalogDto>>
{
    public async Task<ApiResponse<PublicLeaderboardCatalogDto>> Handle(
        GetPublicLeaderboardCatalogQuery request,
        CancellationToken cancellationToken)
    {
        var rawValue = await db.SystemSettings.AsNoTracking()
            .Where(x => !x.IsDeleted && x.Key == SystemSettingKeys.LeaderboardCatalog)
            .Select(x => x.Value)
            .FirstOrDefaultAsync(cancellationToken);
        var boards = LeaderboardCatalogSerializer.ParseOrDefault(rawValue).Boards
            .Where(x => x.Enabled)
            .OrderBy(x => x.SortOrder)
            .ToArray();
        return ApiResponse<PublicLeaderboardCatalogDto>.Ok(new PublicLeaderboardCatalogDto(boards));
    }
}
