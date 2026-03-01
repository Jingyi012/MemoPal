using Mapster;
using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Badges.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Badges.Queries;

public sealed record GetBadgeQuery(string UserId, string BadgeId) : IRequest<BadgeDto>;

public sealed class GetBadgeQueryHandler : IRequestHandler<GetBadgeQuery, BadgeDto>
{
    private readonly IAppDbContext _db;

    public GetBadgeQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<BadgeDto> Handle(GetBadgeQuery request, CancellationToken cancellationToken)
    {
        var def = await _db.BadgeDefinitions.FirstOrDefaultAsync(x => x.Id == request.BadgeId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("Badge not found.");
        var earned = await _db.UserBadges.FirstOrDefaultAsync(
            x => x.BadgeId == request.BadgeId && x.UserId == request.UserId && !x.IsDeleted,
            cancellationToken);

        return (def, earned).Adapt<BadgeDto>();
    }
}

