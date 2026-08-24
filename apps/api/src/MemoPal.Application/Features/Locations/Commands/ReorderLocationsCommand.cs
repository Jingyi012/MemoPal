using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Security;
using MemoPal.Application.Features.Locations.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Locations.Commands;

public sealed record ReorderLocationsCommand(
    string UserId,
    string PalaceId,
    LocationReorderRequest Request,
    bool IsAdmin = false) : IRequest<ApiResponse<IReadOnlyList<LocationDto>>>;

public sealed class ReorderLocationsCommandHandler
    : IRequestHandler<ReorderLocationsCommand, ApiResponse<IReadOnlyList<LocationDto>>>
{
    private readonly IAppDbContext _db;

    public ReorderLocationsCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<LocationDto>>> Handle(ReorderLocationsCommand request, CancellationToken cancellationToken)
    {
        if (request.Request is null || request.Request.LocationIds.Count == 0)
        {
            throw new ValidationAppException("LocationIds is required.");
        }

        var palace = await PalaceAccessPolicy.FindManageablePalaceAsync(
                _db,
                request.PalaceId,
                request.UserId,
                request.IsAdmin,
                cancellationToken)
            ?? throw new NotFoundAppException("Palace not found.");

        var allLocations = await _db.Locations
            .Where(x => x.PalaceId == request.PalaceId)
            .OrderBy(x => x.Position)
            .ToListAsync(cancellationToken);

        var activeLocations = allLocations.Where(x => !x.IsDeleted).ToList();
        if (activeLocations.Count == 0)
        {
            throw new ValidationAppException("No active locations found for this palace.");
        }

        var incomingIds = request.Request.LocationIds
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .ToList();

        if (incomingIds.Count != activeLocations.Count || incomingIds.Distinct(StringComparer.Ordinal).Count() != incomingIds.Count)
        {
            throw new ValidationAppException("LocationIds must contain each active location exactly once.");
        }

        var existingIds = activeLocations.Select(x => x.Id).ToHashSet(StringComparer.Ordinal);
        if (incomingIds.Any(id => !existingIds.Contains(id)))
        {
            throw new ValidationAppException("LocationIds contains IDs that do not belong to this palace.");
        }

        var now = DateTime.UtcNow;
        var maxPosition = allLocations.Select(x => x.Position).DefaultIfEmpty(0).Max();
        var tempBase = maxPosition + allLocations.Count + 10;
        for (var i = 0; i < allLocations.Count; i++)
        {
            allLocations[i].Position = tempBase + i;
            allLocations[i].UpdatedAt = now;
        }

        await _db.SaveChangesAsync(cancellationToken);

        var locationById = activeLocations.ToDictionary(x => x.Id, StringComparer.Ordinal);
        for (var i = 0; i < incomingIds.Count; i++)
        {
            var location = locationById[incomingIds[i]];
            location.Position = i + 1;
            location.UpdatedAt = now;
        }

        var deletedLocations = allLocations
            .Where(x => x.IsDeleted)
            .OrderBy(x => x.Id)
            .ToList();
        for (var i = 0; i < deletedLocations.Count; i++)
        {
            deletedLocations[i].Position = -(i + 1);
            deletedLocations[i].UpdatedAt = now;
        }

        palace.UpdatedAt = now;
        await _db.SaveChangesAsync(cancellationToken);

        var result = activeLocations
            .OrderBy(x => x.Position)
            .Select(x => x.Adapt<LocationDto>())
            .ToList();

        return ApiResponse<IReadOnlyList<LocationDto>>.Ok(result);
    }
}
