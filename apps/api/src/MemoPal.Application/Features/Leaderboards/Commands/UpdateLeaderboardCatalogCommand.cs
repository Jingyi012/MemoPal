using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Leaderboards.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Leaderboards.Commands;

public sealed record UpdateLeaderboardCatalogCommand(LeaderboardCatalogConfigDto? Config)
    : IRequest<ApiResponse<LeaderboardCatalogConfigDto>>;

public sealed class UpdateLeaderboardCatalogCommandHandler(IAppDbContext db)
    : IRequestHandler<UpdateLeaderboardCatalogCommand, ApiResponse<LeaderboardCatalogConfigDto>>
{
    public async Task<ApiResponse<LeaderboardCatalogConfigDto>> Handle(
        UpdateLeaderboardCatalogCommand request,
        CancellationToken cancellationToken)
    {
        if (!LeaderboardCatalogSerializer.TryNormalize(request.Config, out var normalized, out var error))
            return ApiResponse<LeaderboardCatalogConfigDto>.Fail(error);

        var setting = await db.SystemSettings
            .FirstOrDefaultAsync(x => x.Key == SystemSettingKeys.LeaderboardCatalog, cancellationToken);
        var now = DateTime.UtcNow;
        if (setting is null)
        {
            setting = new SystemSetting
            {
                Id = Guid.NewGuid().ToString("N"),
                Key = SystemSettingKeys.LeaderboardCatalog,
                Value = LeaderboardCatalogSerializer.Serialize(normalized),
                Description = "Admin-managed leaderboard catalog and scoring settings.",
                CreatedAt = now,
                UpdatedAt = now,
                IsDeleted = false
            };
            db.SystemSettings.Add(setting);
        }
        else
        {
            setting.Value = LeaderboardCatalogSerializer.Serialize(normalized);
            setting.Description = "Admin-managed leaderboard catalog and scoring settings.";
            setting.UpdatedAt = now;
            setting.IsDeleted = false;
            setting.DeletedAt = null;
            setting.DeletedBy = null;
        }

        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<LeaderboardCatalogConfigDto>.Ok(normalized);
    }
}
