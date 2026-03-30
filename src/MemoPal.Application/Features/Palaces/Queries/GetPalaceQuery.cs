using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Common.Security;
using MemoPal.Domain.Common;
using MemoPal.Application.Features.Palaces.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Palaces.Queries;

public sealed record GetPalaceQuery(
    string UserId,
    string PalaceId,
    bool IsAdmin = false,
    bool AdminCreatedOnly = false) : IRequest<ApiResponse<PalaceDto>>;

public sealed class GetPalaceQueryHandler : IRequestHandler<GetPalaceQuery, ApiResponse<PalaceDto>>
{
    private readonly IAppDbContext _db;

    public GetPalaceQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<PalaceDto>> Handle(GetPalaceQuery request, CancellationToken cancellationToken)
    {
        var palace = await PalaceAccessPolicy.FindAccessiblePalaceAsync(
                _db,
                request.PalaceId,
                request.UserId,
                request.IsAdmin,
                cancellationToken)
            ?? throw new NotFoundAppException("Palace not found.");

        if (request.IsAdmin && request.AdminCreatedOnly)
        {
            var isLegacyOfficial = string.IsNullOrWhiteSpace(palace.CreatedBy) && !palace.IsCustom;
            var isAdminCreated = !string.IsNullOrWhiteSpace(palace.CreatedBy) && await _db.Users
                .AsNoTracking()
                .AnyAsync(
                    x => x.Id == palace.CreatedBy &&
                         x.Role == UserRoles.Admin &&
                         !x.IsDeleted,
                    cancellationToken);

            if (!isLegacyOfficial && !isAdminCreated)
            {
                throw new NotFoundAppException("Palace not found.");
            }
        }

        if (request.IsAdmin)
        {
            var dto = new PalaceDto(
                palace.Id,
                palace.Name,
                palace.Description,
                palace.LocationsCount,
                palace.Thumbnail,
                palace.IsLocked,
                palace.UnlockedAt,
                Math.Max(1, palace.Level),
                palace.IsPremium,
                palace.IsCustom,
                palace.CreatedBy,
                palace.CreatedAt,
                palace.UpdatedAt,
                palace.IsDeleted,
                palace.DeletedAt);

            return ApiResponse<PalaceDto>.Ok(dto.Adapt<PalaceDto>());
        }

        var relation = await _db.UserPalaces
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.UserId == request.UserId &&
                     x.PalaceId == palace.Id &&
                     !x.IsDeleted,
                cancellationToken);

        var isOwnedCustom = palace.IsCustom && relation?.IsOwner == true;
        var isEffectiveCustom = isOwnedCustom;
        var unlockedByUser = relation?.IsUnlocked == true;
        var userAccess = await _db.Users
            .AsNoTracking()
            .Where(x => x.Id == request.UserId && !x.IsDeleted)
            .Select(x => new { x.TotalXp, x.IsPremium })
            .FirstOrDefaultAsync(cancellationToken);
        var userLevel = await _db.ResolveLevelByXpAsync(Math.Max(0, userAccess?.TotalXp ?? 0), cancellationToken);
        var userIsPremium = userAccess?.IsPremium ?? false;

        var requiredLevel = Math.Max(1, palace.Level);
        var isCustomLocked = isEffectiveCustom && !unlockedByUser;
        var levelLocked = !isEffectiveCustom
            && !palace.IsPremium
            && userLevel < requiredLevel;
        var premiumLocked = !isEffectiveCustom
            && palace.IsPremium
            && !userIsPremium
            && !unlockedByUser;
        var effectiveLocked = isCustomLocked || levelLocked || premiumLocked;

        var result = new PalaceDto(
            palace.Id,
            palace.Name,
            palace.Description,
            palace.LocationsCount,
            palace.Thumbnail,
            effectiveLocked,
            relation?.UnlockedAt,
            requiredLevel,
            palace.IsPremium,
            isEffectiveCustom,
            palace.CreatedBy,
            palace.CreatedAt,
            palace.UpdatedAt,
            palace.IsDeleted,
            palace.DeletedAt);

        return ApiResponse<PalaceDto>.Ok(result.Adapt<PalaceDto>());
    }
}
