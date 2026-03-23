using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Badges.Commands;

public sealed record AwardBadgeCommand(string UserId, string BadgeId) : IRequest<ApiResponse<bool>>;

public sealed class AwardBadgeCommandHandler : IRequestHandler<AwardBadgeCommand, ApiResponse<bool>>
{
    private readonly IAppDbContext _db;

    public AwardBadgeCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<bool>> Handle(AwardBadgeCommand request, CancellationToken cancellationToken)
    {
        var definition = await _db.BadgeDefinitions.FirstOrDefaultAsync(x => x.Id == request.BadgeId && !x.IsDeleted, cancellationToken);
        if (definition is null) throw new NotFoundAppException("Badge not found.");

        var now = DateTime.UtcNow;
        var userBadge = await _db.UserBadges.FirstOrDefaultAsync(
            x => x.UserId == request.UserId && x.BadgeId == request.BadgeId,
            cancellationToken);

        if (userBadge is null)
        {
            userBadge = new UserBadge
            {
                Id = Guid.NewGuid().ToString("D"),
                UserId = request.UserId,
                BadgeId = request.BadgeId,
                EarnedAt = now,
                CreatedAt = now,
                UpdatedAt = now
            };
            await _db.UserBadges.AddAsync(userBadge, cancellationToken);
        }
        else
        {
            userBadge.EarnedAt ??= now;
            userBadge.IsDeleted = false;
            userBadge.DeletedAt = null;
            userBadge.UpdatedAt = now;
        }

        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true);
    }
}
