using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Media;
using MemoPal.Application.Common.Security;
using MemoPal.Application.Features.Locations.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Locations.Commands;

public sealed record UpdateLocationsBatchCommand(
    string UserId,
    IReadOnlyList<LocationUpsertRequest> Requests,
    bool IsAdmin = false) : IRequest<ApiResponse<IReadOnlyList<LocationDto>>>;

public sealed class UpdateLocationsBatchCommandHandler
    : IRequestHandler<UpdateLocationsBatchCommand, ApiResponse<IReadOnlyList<LocationDto>>>
{
    private readonly IAppDbContext _db;

    public UpdateLocationsBatchCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<LocationDto>>> Handle(
        UpdateLocationsBatchCommand request,
        CancellationToken cancellationToken)
    {
        if (request.Requests.Count == 0)
        {
            throw new ValidationAppException("Batch payload is empty.");
        }

        var now = DateTime.UtcNow;
        var output = new List<LocationDto>(request.Requests.Count);
        var affectedPalaceIds = new HashSet<string>(StringComparer.Ordinal);

        foreach (var item in request.Requests)
        {
            if (string.IsNullOrWhiteSpace(item.Id))
            {
                throw new ValidationAppException("Location id is required for batch update.");
            }

            var entity = await _db.Locations.FirstOrDefaultAsync(
                x => x.Id == item.Id && !x.IsDeleted,
                cancellationToken) ?? throw new NotFoundAppException("Location not found.");

            var palace = await PalaceAccessPolicy.FindManageablePalaceAsync(
                _db,
                entity.PalaceId,
                request.UserId,
                request.IsAdmin,
                cancellationToken);
            if (palace is null)
            {
                throw new NotFoundAppException("Location not found.");
            }

            if (!string.IsNullOrWhiteSpace(item.Name)) entity.Name = item.Name.Trim();
            if (!string.IsNullOrWhiteSpace(item.Description)) entity.Description = item.Description.Trim();
            if (!string.IsNullOrWhiteSpace(item.ImageUrl)) entity.ImageUrl = MediaPathNormalizer.Normalize(item.ImageUrl);
            entity.Position = item.Position;
            entity.UpdatedAt = item.UpdatedAt ?? now;
            entity.IsDeleted = item.IsDeleted ?? entity.IsDeleted;
            entity.DeletedAt = item.DeletedAt ?? entity.DeletedAt;

            affectedPalaceIds.Add(entity.PalaceId);
            output.Add(entity.Adapt<LocationDto>());
        }

        await _db.SaveChangesAsync(cancellationToken);
        await LocationCountSyncHelper.RecalculatePalaceLocationCountsAsync(_db, affectedPalaceIds, now, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        return ApiResponse<IReadOnlyList<LocationDto>>.Ok(output);
    }
}

