using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Locations.Commands;

internal static class LocationCountSyncHelper
{
    public static async Task RecalculatePalaceLocationCountsAsync(
        IAppDbContext db,
        IReadOnlyCollection<string> palaceIds,
        DateTime now,
        CancellationToken cancellationToken)
    {
        if (palaceIds.Count == 0)
        {
            return;
        }

        var counts = await db.Locations
            .Where(x => palaceIds.Contains(x.PalaceId) && !x.IsDeleted)
            .GroupBy(x => x.PalaceId)
            .Select(g => new { PalaceId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.PalaceId, x => x.Count, cancellationToken);

        var palaces = await db.Palaces
            .Where(x => palaceIds.Contains(x.Id) && !x.IsDeleted)
            .ToListAsync(cancellationToken);

        foreach (var palace in palaces)
        {
            palace.LocationsCount = counts.TryGetValue(palace.Id, out var count) ? count : 0;
            palace.UpdatedAt = now;
        }
    }
}

