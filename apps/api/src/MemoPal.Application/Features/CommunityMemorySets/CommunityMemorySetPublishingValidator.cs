using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.CommunityMemorySets;

internal static class CommunityMemorySetPublishingValidator
{
    public static async Task<bool> ValidateAsync(
        IAppDbContext db,
        MemorySet memorySet,
        bool confirmPrivateAssets,
        CancellationToken cancellationToken)
    {
        if (memorySet.Status is not (MemorySetStatuses.Ready or MemorySetStatuses.Active) ||
            memorySet.Items.All(x => x.IsDeleted) || memorySet.TechniquePlan is null || memorySet.TechniquePlan.IsDeleted)
            throw new ValidationAppException("Complete this memory before sharing it publicly.");

        if (memorySet.TechniquePlan.PegBindings.Where(x => !x.IsDeleted).Select(x => x.SceneAssetUrl)
            .Concat(memorySet.TechniquePlan.PalaceBindings.Where(x => !x.IsDeleted).Select(x => x.SceneAssetUrl))
            .Any(url => url?.Contains("/v1/ai-credits/images/", StringComparison.OrdinalIgnoreCase) == true))
            throw new ValidationAppException("AI illustrations are private. Remove the illustration before sharing this memory publicly.");

        var hasPrivateAssets =
            memorySet.Items.Any(x => !x.IsDeleted && !string.IsNullOrWhiteSpace(x.PronunciationAudioUrl)) ||
            memorySet.TechniquePlan.PegBindings.Any(x => !x.IsDeleted && !string.IsNullOrWhiteSpace(x.SceneAssetUrl)) ||
            memorySet.TechniquePlan.PalaceBindings.Any(x => !x.IsDeleted &&
                (x.IsCustomScene || !string.IsNullOrWhiteSpace(x.SceneAssetUrl)));

        if (memorySet.TechniqueKey == MemoryTechniqueKeys.Palace)
        {
            var sceneId = memorySet.TechniquePlan.PalaceSceneId;
            var scene = sceneId is null
                ? null
                : await db.PalaceScenes.AsNoTracking().FirstOrDefaultAsync(
                    x => x.Id == sceneId && !x.IsDeleted,
                    cancellationToken);
            if (scene is null)
                throw new ValidationAppException("The Palace scene is unavailable.");

            var usesPublicTemplate = scene.IsTemplate && scene.Status == PalaceSceneStatuses.Published;
            if (!usesPublicTemplate)
            {
                if (scene.UserId != memorySet.UserId)
                    throw new ValidationAppException("The custom Palace scene does not belong to this memory owner.");
                hasPrivateAssets = true;
            }
        }

        if (hasPrivateAssets && !confirmPrivateAssets)
            throw new ValidationAppException(
                "This memory contains private photos, audio, or custom scenes. Confirm sharing private assets to publish it.");

        return hasPrivateAssets;
    }
}
