using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Badges.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Badges.Queries;

public sealed record GetBadgeQuery(string UserId, string BadgeId) : IRequest<ApiResponse<BadgeDto>>;

public sealed class GetBadgeQueryHandler : IRequestHandler<GetBadgeQuery, ApiResponse<BadgeDto>>
{
    private readonly IAppDbContext _db;

    public GetBadgeQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<BadgeDto>> Handle(GetBadgeQuery request, CancellationToken cancellationToken)
    {
        var def = await _db.BadgeDefinitions.FirstOrDefaultAsync(x => x.Id == request.BadgeId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("Badge not found.");
        var earned = await _db.UserBadges.FirstOrDefaultAsync(
            x => x.BadgeId == request.BadgeId && x.UserId == request.UserId && !x.IsDeleted,
            cancellationToken);

        return ApiResponse<BadgeDto>.Ok(ToBadgeDto(def, earned));
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
            earned?.EarnedAt,
            definition.CreatedAt,
            definition.UpdatedAt,
            definition.IsDeleted,
            definition.DeletedAt);
    }
}




