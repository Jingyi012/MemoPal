using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Security;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Palaces.Commands;

public sealed record UnlockPalaceCommand(string UserId, string PalaceId, bool IsAdmin = false) : IRequest<ApiResponse<bool>>;

public sealed class UnlockPalaceCommandHandler : IRequestHandler<UnlockPalaceCommand, ApiResponse<bool>>
{
    private readonly IAppDbContext _db;

    public UnlockPalaceCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<bool>> Handle(UnlockPalaceCommand request, CancellationToken cancellationToken)
    {
        var entity = await PalaceAccessPolicy.FindAccessiblePalaceAsync(
            _db,
            request.PalaceId,
            request.UserId,
            request.IsAdmin,
            cancellationToken);

        if (entity is null) return ApiResponse<bool>.Fail("Palace not found.");

        var now = DateTime.UtcNow;
        var relation = await _db.UserPalaces.FirstOrDefaultAsync(
            x => x.UserId == request.UserId &&
                 x.PalaceId == request.PalaceId &&
                 !x.IsDeleted,
            cancellationToken);

        if (relation is null)
        {
            relation = new UserPalace
            {
                Id = Guid.NewGuid().ToString("D"),
                UserId = request.UserId,
                PalaceId = request.PalaceId,
                IsOwner = false,
                IsUnlocked = true,
                UnlockedAt = now,
                CreatedAt = now,
                UpdatedAt = now
            };
            await _db.UserPalaces.AddAsync(relation, cancellationToken);
        }
        else
        {
            relation.IsUnlocked = true;
            relation.UnlockedAt ??= now;
            relation.UpdatedAt = now;
        }

        entity.UpdatedAt = now;
        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true);
    }
}
