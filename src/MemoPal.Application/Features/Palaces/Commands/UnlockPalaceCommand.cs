using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Palaces.Commands;

public sealed record UnlockPalaceCommand(string UserId, string PalaceId) : IRequest<ApiResponse<bool>>;

public sealed class UnlockPalaceCommandHandler : IRequestHandler<UnlockPalaceCommand, ApiResponse<bool>>
{
    private readonly IAppDbContext _db;

    public UnlockPalaceCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<bool>> Handle(UnlockPalaceCommand request, CancellationToken cancellationToken)
    {
        var entity = await _db.Palaces.FirstOrDefaultAsync(
            x => x.Id == request.PalaceId &&
                 !x.IsDeleted &&
                 (!x.IsCustom || x.CreatedBy == request.UserId),
            cancellationToken);

        if (entity is null) return ApiResponse<bool>.Fail("Palace not found.");

        entity.IsLocked = false;
        entity.UnlockedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true);
    }
}
