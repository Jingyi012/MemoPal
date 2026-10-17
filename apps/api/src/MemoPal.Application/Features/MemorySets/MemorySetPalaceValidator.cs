using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.MemorySets.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.MemorySets;

internal static class MemorySetPalaceValidator
{
    public static async Task ValidateAsync(
        IAppDbContext db,
        string userId,
        MemorySetUpsertRequest request,
        CancellationToken cancellationToken)
    {
        if (request.TechniqueKey != MemoryTechniqueKeys.Palace || request.TechniquePlan is null)
        {
            return;
        }

        var sceneId = request.TechniquePlan.PalaceSceneId;
        if (string.IsNullOrWhiteSpace(sceneId))
        {
            return;
        }

        var user = await db.Users.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == userId && !x.IsDeleted, cancellationToken);
        var currentLevel = user is null
            ? 0
            : await db.ResolveLevelByXpAsync(Math.Max(0, user.TotalXp), cancellationToken);
        var isPremium = user?.IsPremium == true;
        var canUseScene = await db.PalaceScenes.AnyAsync(x =>
            x.Id == sceneId &&
            !x.IsDeleted &&
            (x.UserId == userId ||
                (x.IsTemplate && x.Status == PalaceSceneStatuses.Published &&
                 x.UnlockLevel <= currentLevel && (isPremium || !x.IsPremium))),
            cancellationToken);

        if (!canUseScene)
        {
            throw new ValidationAppException("The selected Palace scene is unavailable.");
        }

        var locusIds = request.TechniquePlan.PalaceBindings
            .Select(x => x.LocusId)
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct(StringComparer.Ordinal)
            .ToList();

        var validLocusCount = await db.PalaceLoci.CountAsync(x =>
            locusIds.Contains(x.Id) && x.PalaceSceneId == sceneId && !x.IsDeleted,
            cancellationToken);

        if (validLocusCount != locusIds.Count)
        {
            throw new ValidationAppException("Every Palace binding must use a locus from the selected scene.");
        }
    }
}
