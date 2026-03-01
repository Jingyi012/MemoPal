using Mapster;
using MediatR;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Badges.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Badges.Queries;

public sealed record GetUpdatedBadgesQuery(string UserId, DateTime Since) : IRequest<IReadOnlyList<BadgeDto>>;

public sealed class GetUpdatedBadgesQueryHandler : IRequestHandler<GetUpdatedBadgesQuery, IReadOnlyList<BadgeDto>>
{
    private readonly IAppDbContext _db;

    public GetUpdatedBadgesQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<BadgeDto>> Handle(GetUpdatedBadgesQuery request, CancellationToken cancellationToken)
    {
        var defs = await _db.BadgeDefinitions
            .Where(x => x.UpdatedAt > request.Since || !x.IsDeleted)
            .ToListAsync(cancellationToken);
        var userBadges = await _db.UserBadges
            .Where(x => x.UserId == request.UserId && (x.UpdatedAt > request.Since || !x.IsDeleted))
            .ToListAsync(cancellationToken);
        var map = userBadges.ToDictionary(x => x.BadgeId, x => x);

        return defs.Select(d =>
        {
            map.TryGetValue(d.Id, out var earned);
            return (d, earned).Adapt<BadgeDto>();
        }).ToList();
    }
}

