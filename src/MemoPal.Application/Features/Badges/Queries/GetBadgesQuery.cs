using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Badges.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Badges.Queries;

public sealed record GetBadgesQuery(string UserId) : IRequest<ApiResponse<IReadOnlyList<BadgeDto>>>;

public sealed class GetBadgesQueryHandler : IRequestHandler<GetBadgesQuery, ApiResponse<IReadOnlyList<BadgeDto>>>
{
    private readonly IAppDbContext _db;

    public GetBadgesQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<BadgeDto>>> Handle(GetBadgesQuery request, CancellationToken cancellationToken)
    {
        var defs = await _db.BadgeDefinitions
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
        var userBadges = await _db.UserBadges
            .Where(x => x.UserId == request.UserId && !x.IsDeleted)
            .ToListAsync(cancellationToken);
        var map = userBadges.ToDictionary(x => x.BadgeId, x => x);

        var items = defs.Select(d =>
        {
            map.TryGetValue(d.Id, out var earned);
            return ToBadgeDto(d, earned);
        }).ToList();
        return ApiResponse<IReadOnlyList<BadgeDto>>.Ok(items);
    }

    private static BadgeDto ToBadgeDto(BadgeDefinition definition, UserBadge? earned)
    {
        return new BadgeDto(
            definition.Id,
            definition.Key,
            definition.Name,
            definition.Description,
            definition.Icon,
            definition.IconUrl,
            definition.Rarity,
            definition.ConditionType,
            definition.ConditionValue,
            earned?.EarnedAt,
            definition.CreatedAt,
            definition.UpdatedAt,
            definition.IsDeleted,
            definition.DeletedAt);
    }
}
