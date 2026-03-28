using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Users.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Users.Queries;

public sealed record GetManagedUserPalacesPagedQuery(
    string UserId,
    int PageNumber = 1,
    int PageSize = 20,
    bool? IsCustom = null,
    bool RequireUserLessons = false) : IRequest<PaginatedResponse<ManagedUserPalaceListItemDto>>;

public sealed class GetManagedUserPalacesPagedQueryHandler
    : IRequestHandler<GetManagedUserPalacesPagedQuery, PaginatedResponse<ManagedUserPalaceListItemDto>>
{
    private readonly IAppDbContext _db;

    public GetManagedUserPalacesPagedQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<PaginatedResponse<ManagedUserPalaceListItemDto>> Handle(GetManagedUserPalacesPagedQuery request, CancellationToken cancellationToken)
    {
        await ManagedUserDataQueryHelpers.EnsureUserExistsAsync(_db, request.UserId, cancellationToken);

        var pageNumber = ManagedUserDataQueryHelpers.NormalizePageNumber(request.PageNumber);
        var pageSize = ManagedUserDataQueryHelpers.NormalizePageSize(request.PageSize);

        var lessonPalaceIdsQuery = _db.Lessons
            .AsNoTracking()
            .Where(x => x.CreatedBy == request.UserId)
            .Select(x => x.PalaceId)
            .Distinct();

        var lessonCountsQuery = _db.Lessons
            .AsNoTracking()
            .Where(x => x.CreatedBy == request.UserId)
            .GroupBy(x => x.PalaceId)
            .Select(g => new
            {
                PalaceId = g.Key,
                Count = g.Count(),
            });

        var relatedPalaceIdsQuery = _db.UserPalaces
            .AsNoTracking()
            .Where(x => x.UserId == request.UserId && !x.IsDeleted)
            .Select(x => x.PalaceId)
            .Union(lessonPalaceIdsQuery);

        var baseQuery = _db.Palaces
            .AsNoTracking()
            .Where(palace => !palace.IsDeleted && relatedPalaceIdsQuery.Contains(palace.Id));

        if (request.IsCustom.HasValue)
        {
            baseQuery = baseQuery.Where(x => x.IsCustom == request.IsCustom.Value);
        }

        if (request.RequireUserLessons)
        {
            baseQuery = baseQuery.Where(x => lessonPalaceIdsQuery.Contains(x.Id));
        }

        var orderedQuery = baseQuery.OrderByDescending(x => x.UpdatedAt);

        var totalCount = await orderedQuery.CountAsync(cancellationToken);
        var pageRows = await orderedQuery
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var palaceIds = pageRows.Select(x => x.Id).ToList();

        if (palaceIds.Count == 0)
        {
            return PaginatedResponse<ManagedUserPalaceListItemDto>.Ok([], pageNumber, pageSize, totalCount);
        }

        var locationCountsByPalaceId = await _db.Locations
            .AsNoTracking()
            .Where(x => palaceIds.Contains(x.PalaceId))
            .GroupBy(x => x.PalaceId)
            .Select(g => new
            {
                PalaceId = g.Key,
                Count = g.Count(),
            })
            .ToDictionaryAsync(x => x.PalaceId, x => x.Count, cancellationToken);

        var lessonCountsByPalaceId = await lessonCountsQuery
            .Where(x => palaceIds.Contains(x.PalaceId))
            .ToDictionaryAsync(x => x.PalaceId, x => x.Count, cancellationToken);

        var userPalaceRelations = await _db.UserPalaces
            .AsNoTracking()
            .Where(x => x.UserId == request.UserId && !x.IsDeleted && palaceIds.Contains(x.PalaceId))
            .OrderByDescending(x => x.UpdatedAt)
            .ToListAsync(cancellationToken);

        var userPalaceByPalaceId = userPalaceRelations
            .GroupBy(x => x.PalaceId)
            .ToDictionary(
                g => g.Key,
                g => g.First(),
                StringComparer.Ordinal);

        var items = pageRows
            .Select(x =>
            {
                userPalaceByPalaceId.TryGetValue(x.Id, out var relation);

                return new ManagedUserPalaceListItemDto(
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
                    locationCountsByPalaceId.GetValueOrDefault(x.Id, 0),
                    lessonCountsByPalaceId.GetValueOrDefault(x.Id, 0));
            })
            .ToList();

        return PaginatedResponse<ManagedUserPalaceListItemDto>.Ok(items, pageNumber, pageSize, totalCount);
    }
}
