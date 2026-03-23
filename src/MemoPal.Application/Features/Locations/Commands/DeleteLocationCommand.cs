using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Locations.Commands;

public sealed record DeleteLocationCommand(string UserId, string LocationId, bool IsAdmin = false) : IRequest<ApiResponse<bool>>;

public sealed class DeleteLocationCommandHandler : IRequestHandler<DeleteLocationCommand, ApiResponse<bool>>
{
    private readonly IAppDbContext _db;

    public DeleteLocationCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<bool>> Handle(DeleteLocationCommand request, CancellationToken cancellationToken)
    {
        var entity = await _db.Locations.FirstOrDefaultAsync(x => x.Id == request.LocationId && !x.IsDeleted, cancellationToken);
        if (entity is null) return ApiResponse<bool>.Ok(false);

        var palace = await _db.Palaces.FirstOrDefaultAsync(
            x => x.Id == entity.PalaceId && !x.IsDeleted && (request.IsAdmin || !x.IsCustom || x.CreatedBy == request.UserId),
            cancellationToken);
        if (palace is null) return ApiResponse<bool>.Ok(false);

        var minPositionInPalace = await _db.Locations
            .Where(x => x.PalaceId == entity.PalaceId)
            .Select(x => (int?)x.Position)
            .MinAsync(cancellationToken) ?? 0;

        entity.IsDeleted = true;
        entity.Position = minPositionInPalace <= 0 ? minPositionInPalace - 1 : -1;
        entity.DeletedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;

        palace.LocationsCount = await _db.Locations.CountAsync(x => x.PalaceId == palace.Id && !x.IsDeleted, cancellationToken);
        palace.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true);
    }
}
