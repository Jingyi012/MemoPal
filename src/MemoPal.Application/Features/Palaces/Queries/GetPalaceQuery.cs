using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Security;
using MemoPal.Application.Features.Palaces.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Palaces.Queries;

public sealed record GetPalaceQuery(string UserId, string PalaceId, bool IsAdmin = false) : IRequest<ApiResponse<PalaceDto>>;

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

        if (request.IsAdmin)
        {
            return ApiResponse<PalaceDto>.Ok(new PalaceDto(
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
                palace.DeletedAt));
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
            .Select(x => new { x.Level, x.IsPremium })
            .FirstOrDefaultAsync(cancellationToken);
        var userLevel = Math.Max(1, userAccess?.Level ?? 1);
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
        var effectiveLocked = palace.IsLocked || isCustomLocked || levelLocked || premiumLocked;

        return ApiResponse<PalaceDto>.Ok(new PalaceDto(
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
            palace.DeletedAt));
    }
}
