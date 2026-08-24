using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Security;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Locations.Commands;

public sealed record DeleteLocationsBatchCommand(
    string UserId,
    IReadOnlyList<string> LocationIds,
    bool IsAdmin = false) : IRequest<ApiResponse<int>>;

public sealed class DeleteLocationsBatchCommandHandler
    : IRequestHandler<DeleteLocationsBatchCommand, ApiResponse<int>>
{
    private readonly IAppDbContext _db;

    public DeleteLocationsBatchCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<int>> Handle(DeleteLocationsBatchCommand request, CancellationToken cancellationToken)
    {
        if (request.LocationIds.Count == 0)
        {
            throw new ValidationAppException("LocationIds is required.");
        }

        var now = DateTime.UtcNow;
        var deleted = 0;
        var affectedPalaceIds = new HashSet<string>(StringComparer.Ordinal);

        foreach (var locationId in request.LocationIds)
        {
            var entity = await _db.Locations.FirstOrDefaultAsync(
                x => x.Id == locationId && !x.IsDeleted,
                cancellationToken);
            if (entity is null) continue;

            var palace = await PalaceAccessPolicy.FindManageablePalaceAsync(
                _db,
                entity.PalaceId,
                request.UserId,
                request.IsAdmin,
                cancellationToken);
            if (palace is null) continue;

            var minPositionInPalace = await _db.Locations
                .Where(x => x.PalaceId == entity.PalaceId)
                .Select(x => (int?)x.Position)
                .MinAsync(cancellationToken) ?? 0;

            entity.IsDeleted = true;
            entity.Position = minPositionInPalace <= 0 ? minPositionInPalace - 1 : -1;
            entity.DeletedAt = now;
            entity.UpdatedAt = now;

            affectedPalaceIds.Add(entity.PalaceId);
            deleted++;
        }

        if (deleted > 0)
        {
            await _db.SaveChangesAsync(cancellationToken);
            await LocationCountSyncHelper.RecalculatePalaceLocationCountsAsync(_db, affectedPalaceIds, now, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
        }

        return ApiResponse<int>.Ok(deleted);
    }
}

