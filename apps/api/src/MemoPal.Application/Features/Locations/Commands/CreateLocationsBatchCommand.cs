using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Media;
using MemoPal.Application.Common.Security;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Locations.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Locations.Commands;

public sealed record CreateLocationsBatchCommand(
    string UserId,
    IReadOnlyList<LocationUpsertRequest> Requests,
    bool IsAdmin = false) : IRequest<ApiResponse<IReadOnlyList<LocationDto>>>;

public sealed class CreateLocationsBatchCommandHandler
    : IRequestHandler<CreateLocationsBatchCommand, ApiResponse<IReadOnlyList<LocationDto>>>
{
    private readonly IAppDbContext _db;

    public CreateLocationsBatchCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<LocationDto>>> Handle(
        CreateLocationsBatchCommand request,
        CancellationToken cancellationToken)
    {
        if (request.Requests.Count == 0)
        {
            throw new ValidationAppException("Batch payload is empty.");
        }

        var now = DateTime.UtcNow;
        var output = new List<LocationDto>(request.Requests.Count);
        var affectedPalaceIds = new HashSet<string>(StringComparer.Ordinal);
        var palaceCache = new Dictionary<string, Palace>(StringComparer.Ordinal);
        var currentLocationCountByPalace = new Dictionary<string, int>(StringComparer.Ordinal);

        int? allowedCustomLocationsPerPalace = null;
        bool? isPremiumUser = null;

        foreach (var item in request.Requests)
        {
            if (string.IsNullOrWhiteSpace(item.PalaceId) ||
                string.IsNullOrWhiteSpace(item.Name) ||
                string.IsNullOrWhiteSpace(item.Description) ||
                string.IsNullOrWhiteSpace(item.ImageUrl))
            {
                throw new ValidationAppException("palaceId, name, description, and imageUrl are required.");
            }

            if (!palaceCache.TryGetValue(item.PalaceId, out var palace))
            {
                palace = await PalaceAccessPolicy.FindManageablePalaceAsync(
                    _db,
                    item.PalaceId,
                    request.UserId,
                    request.IsAdmin,
                    cancellationToken) ?? throw new NotFoundAppException("Palace not found.");

                palaceCache[item.PalaceId] = palace;
            }

            var id = string.IsNullOrWhiteSpace(item.Id) ? Guid.NewGuid().ToString("D") : item.Id!;
            var entity = await _db.Locations.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (entity is null && palace.IsCustom && !request.IsAdmin)
            {
                if (!isPremiumUser.HasValue)
                {
                    var currentUser = await _db.Users.FirstOrDefaultAsync(x => x.Id == request.UserId, cancellationToken)
                        ?? throw new NotFoundAppException("Current user not found.");
                    isPremiumUser = currentUser.IsPremium;
                }

                allowedCustomLocationsPerPalace ??=
                    await _db.GetCustomLocationsPerPalaceLimitAsync(isPremiumUser.Value, cancellationToken);

                if (!currentLocationCountByPalace.TryGetValue(item.PalaceId, out var existingCount))
                {
                    existingCount = await _db.Locations.CountAsync(
                        x => x.PalaceId == item.PalaceId && !x.IsDeleted,
                        cancellationToken);
                }

                if (existingCount >= allowedCustomLocationsPerPalace.Value)
                {
                    throw new ValidationAppException("You have reached the maximum number of custom locations allowed for this palace.");
                }

                currentLocationCountByPalace[item.PalaceId] = existingCount + 1;
            }

            if (entity is null)
            {
                entity = new Location
                {
                    Id = id,
                    CreatedAt = item.CreatedAt ?? now
                };
                await _db.Locations.AddAsync(entity, cancellationToken);
            }

            entity.PalaceId = item.PalaceId;
            entity.Position = item.Position;
            entity.Name = item.Name.Trim();
            entity.Description = item.Description.Trim();
            entity.ImageUrl = MediaPathNormalizer.Normalize(item.ImageUrl);
            entity.UpdatedAt = item.UpdatedAt ?? now;
            entity.IsDeleted = item.IsDeleted ?? false;
            entity.DeletedAt = item.DeletedAt;

            affectedPalaceIds.Add(entity.PalaceId);
            output.Add(entity.Adapt<LocationDto>());
        }

        await _db.SaveChangesAsync(cancellationToken);
        await LocationCountSyncHelper.RecalculatePalaceLocationCountsAsync(_db, affectedPalaceIds, now, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        return ApiResponse<IReadOnlyList<LocationDto>>.Ok(output);
    }
}

