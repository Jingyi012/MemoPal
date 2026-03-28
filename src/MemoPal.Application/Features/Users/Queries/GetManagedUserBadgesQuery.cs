using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Users.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Users.Queries;

public sealed record GetManagedUserBadgesQuery(string UserId, int PageNumber = 1, int PageSize = 20)
    : IRequest<PaginatedResponse<ManagedUserBadgeDataDto>>;

public sealed class GetManagedUserBadgesQueryHandler
    : IRequestHandler<GetManagedUserBadgesQuery, PaginatedResponse<ManagedUserBadgeDataDto>>
{
    private readonly IAppDbContext _db;

    public GetManagedUserBadgesQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<PaginatedResponse<ManagedUserBadgeDataDto>> Handle(GetManagedUserBadgesQuery request, CancellationToken cancellationToken)
    {
        await ManagedUserDataQueryHelpers.EnsureUserExistsAsync(_db, request.UserId, cancellationToken);

        var pageNumber = ManagedUserDataQueryHelpers.NormalizePageNumber(request.PageNumber);
        var pageSize = ManagedUserDataQueryHelpers.NormalizePageSize(request.PageSize);

        var baseQuery = from userBadge in _db.UserBadges.AsNoTracking()
                        join definition in _db.BadgeDefinitions.AsNoTracking()
                            on userBadge.BadgeId equals definition.Id
                        where userBadge.UserId == request.UserId
                        orderby userBadge.UpdatedAt descending
                        select new { UserBadge = userBadge, Definition = definition };

        var totalCount = await baseQuery.CountAsync(cancellationToken);
        var rows = await baseQuery
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = rows
            .Select(x => new ManagedUserBadgeDataDto(
                x.UserBadge.Id,
                x.UserBadge.BadgeId,
                x.Definition.Key,
                x.Definition.Name,
                x.Definition.Description,
                x.Definition.Rarity,
                x.UserBadge.EarnedAt,
                x.UserBadge.IsDeleted,
                x.UserBadge.CreatedAt,
                x.UserBadge.UpdatedAt))
            .ToList();

        return PaginatedResponse<ManagedUserBadgeDataDto>.Ok(items, pageNumber, pageSize, totalCount);
    }
}
