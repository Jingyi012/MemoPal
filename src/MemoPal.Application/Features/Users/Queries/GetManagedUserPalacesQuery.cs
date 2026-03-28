using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Users.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Users.Queries;

public sealed record GetManagedUserPalacesQuery(string UserId) : IRequest<ApiResponse<IReadOnlyList<ManagedUserPalaceDataDto>>>;

public sealed class GetManagedUserPalacesQueryHandler
    : IRequestHandler<GetManagedUserPalacesQuery, ApiResponse<IReadOnlyList<ManagedUserPalaceDataDto>>>
{
    private readonly IAppDbContext _db;

    public GetManagedUserPalacesQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<ManagedUserPalaceDataDto>>> Handle(GetManagedUserPalacesQuery request, CancellationToken cancellationToken)
    {
        await ManagedUserDataQueryHelpers.EnsureUserExistsAsync(_db, request.UserId, cancellationToken);

        var userPalaceRelations = await _db.UserPalaces
            .AsNoTracking()
            .Where(x => x.UserId == request.UserId && !x.IsDeleted)
            .OrderByDescending(x => x.UpdatedAt)
            .ToListAsync(cancellationToken);

        var lessonPalaceIds = await _db.Lessons
            .AsNoTracking()
            .Where(x => x.CreatedBy == request.UserId)
            .Select(x => x.PalaceId)
            .Distinct()
            .ToListAsync(cancellationToken);

        var lessonCountByPalaceId = await _db.Lessons
            .AsNoTracking()
            .Where(x => x.CreatedBy == request.UserId)
            .GroupBy(x => x.PalaceId)
            .Select(g => new { PalaceId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.PalaceId, x => x.Count, cancellationToken);

        var palaceIds = userPalaceRelations
            .Select(x => x.PalaceId)
            .Concat(lessonPalaceIds)
            .Distinct(StringComparer.Ordinal)
            .ToList();

        if (palaceIds.Count == 0)
        {
            return ApiResponse<IReadOnlyList<ManagedUserPalaceDataDto>>.Ok([]);
        }

        var palaces = await _db.Palaces
            .AsNoTracking()
            .Where(x => palaceIds.Contains(x.Id) && !x.IsDeleted)
            .OrderByDescending(x => x.UpdatedAt)
            .ToListAsync(cancellationToken);

        var locations = await _db.Locations
            .AsNoTracking()
            .Where(x => palaceIds.Contains(x.PalaceId))
            .OrderBy(x => x.Position)
            .ThenByDescending(x => x.UpdatedAt)
            .ToListAsync(cancellationToken);

        var userPalaceByPalaceId = userPalaceRelations
            .GroupBy(x => x.PalaceId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(x => x.UpdatedAt).First(),
                StringComparer.Ordinal);

        var locationsByPalaceId = locations
            .GroupBy(x => x.PalaceId)
            .ToDictionary(
                g => g.Key,
                g => (IReadOnlyList<ManagedUserLocationDataDto>)g
                    .Select(x => new ManagedUserLocationDataDto(
                        x.Id,
                        x.PalaceId,
                        x.Position,
                        x.Name,
                        x.Description,
                        x.ImageUrl,
                        x.IsDeleted,
                        x.CreatedAt,
                        x.UpdatedAt))
                    .ToList(),
                StringComparer.Ordinal);

        var palaceDtos = palaces
            .Select(x =>
            {
                userPalaceByPalaceId.TryGetValue(x.Id, out var relation);
                return new ManagedUserPalaceDataDto(
                    x.Id,
                    x.Name,
                    x.Description,
                    x.Level,
                    x.IsPremium,
                    x.IsCustom,
                    relation?.IsOwner ?? false,
                    relation?.IsUnlocked ?? false,
                    relation?.UnlockedAt,
                    x.IsDeleted,
                    x.CreatedAt,
                    x.UpdatedAt,
                    locationsByPalaceId.GetValueOrDefault(x.Id) ?? [],
                    lessonCountByPalaceId.GetValueOrDefault(x.Id, 0));
            })
            .ToList();

        return ApiResponse<IReadOnlyList<ManagedUserPalaceDataDto>>.Ok(palaceDtos);
    }
}
