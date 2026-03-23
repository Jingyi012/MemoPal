using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Common;
using MemoPal.Application.Features.Palaces.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Palaces.Queries;

public sealed record GetPalacesQuery(string UserId, int? PageNumber = null, int? PageSize = null, bool IsAdmin = false)
    : IRequest<ApiResponse<IReadOnlyList<PalaceDto>>>;

public sealed class GetPalacesQueryHandler : IRequestHandler<GetPalacesQuery, ApiResponse<IReadOnlyList<PalaceDto>>>
{
    private readonly IAppDbContext _db;

    public GetPalacesQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<PalaceDto>>> Handle(GetPalacesQuery request, CancellationToken cancellationToken)
    {
        var baseQuery = _db.Palaces
            .Where(x => !x.IsDeleted)
            .AsQueryable();

        var palaces = await baseQuery.ToListAsync(cancellationToken);
        var userPalacesByPalaceId = request.IsAdmin
            ? new Dictionary<string, Domain.Entities.UserPalace>(StringComparer.Ordinal)
            : await _db.UserPalaces
                .AsNoTracking()
                .Where(x => x.UserId == request.UserId && !x.IsDeleted)
                .ToDictionaryAsync(x => x.PalaceId, cancellationToken);
        var customCreatorIds = request.IsAdmin
            ? []
            : palaces
                .Where(x => x.IsCustom && !string.IsNullOrWhiteSpace(x.CreatedBy))
                .Select(x => x.CreatedBy!)
                .Distinct(StringComparer.Ordinal)
                .ToList();

        var adminCreatorIds = request.IsAdmin || customCreatorIds.Count == 0
            ? new HashSet<string>(StringComparer.Ordinal)
            : await _db.Users
                .AsNoTracking()
                .Where(x => customCreatorIds.Contains(x.Id) && x.Role == UserRoles.Admin && !x.IsDeleted)
                .Select(x => x.Id)
                .ToHashSetAsync(cancellationToken);
        var usePagination = request.PageNumber.HasValue && request.PageSize.HasValue;
        var userAccess = request.IsAdmin
            ? null
            : await _db.Users
                .AsNoTracking()
                .Where(x => x.Id == request.UserId && !x.IsDeleted)
                .Select(x => new { x.Level, x.IsPremium })
                .FirstOrDefaultAsync(cancellationToken);
        var userLevel = request.IsAdmin ? int.MaxValue : Math.Max(1, userAccess?.Level ?? 1);
        var userIsPremium = request.IsAdmin || (userAccess?.IsPremium ?? false);

        var projected = palaces
            .Where(palace =>
            {
                if (request.IsAdmin || !palace.IsCustom)
                {
                    return true;
                }

                if (userPalacesByPalaceId.TryGetValue(palace.Id, out var relation) && relation.IsOwner)
                {
                    return true;
                }

                return !string.IsNullOrWhiteSpace(palace.CreatedBy) && adminCreatorIds.Contains(palace.CreatedBy);
            })
            .Select(palace =>
            {
                userPalacesByPalaceId.TryGetValue(palace.Id, out var relation);
                var isOwnedCustom = palace.IsCustom && relation?.IsOwner == true;
                var isEffectiveCustom = request.IsAdmin ? palace.IsCustom : isOwnedCustom;
                var unlockedByUser = relation?.IsUnlocked == true;
                var requiredLevel = Math.Max(1, palace.Level);
                var isCustomLocked = isEffectiveCustom && !unlockedByUser;
                var isLevelLocked = !isEffectiveCustom
                    && !palace.IsPremium
                    && userLevel < requiredLevel;
                var isPremiumLocked = !isEffectiveCustom
                    && palace.IsPremium
                    && !userIsPremium
                    && !unlockedByUser;

                var effectiveLocked = request.IsAdmin
                    ? palace.IsLocked
                    : palace.IsLocked || isCustomLocked || isLevelLocked || isPremiumLocked;

                var dto = new PalaceDto(
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

                return new PalaceProjection(
                    dto,
                    isEffectiveCustom ? int.MaxValue : requiredLevel,
                    palace.CreatedAt);
            })
            .OrderBy(x => x.SortLevel)
            .ThenBy(x => x.CreatedAt)
            .Select(x => x.Dto)
            .ToList();

        if (!usePagination)
        {
            return ApiResponse<IReadOnlyList<PalaceDto>>.Ok(projected);
        }

        var totalCount = projected.Count;
        var pageNumber = Math.Max(1, request.PageNumber!.Value);
        var pageSize = Math.Clamp(request.PageSize!.Value, 1, 100);

        var items = projected
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return PaginatedResponse<PalaceDto>.Ok(items, pageNumber, pageSize, totalCount);
    }
    private sealed record PalaceProjection(PalaceDto Dto, int SortLevel, DateTime CreatedAt);
}
