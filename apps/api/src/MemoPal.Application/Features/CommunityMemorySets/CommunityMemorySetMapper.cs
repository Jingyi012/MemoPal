using System.Text.Json;
using MemoPal.Application.Features.CommunityMemorySets.DTOs;
using MemoPal.Application.Features.MemorySets.DTOs;
using MemoPal.Domain.Entities;

namespace MemoPal.Application.Features.CommunityMemorySets;

internal static class CommunityMemorySetMapper
{
    public static CommunityMemorySetSummaryDto ToSummary(
        MemorySet memorySet,
        User author,
        int copyCount,
        int helpfulCount,
        bool isHelpful,
        bool isBookmarked,
        string? existingCopyId,
        string? coverImageUrl) => new(
            memorySet.Id,
            memorySet.Title,
            memorySet.Description,
            memorySet.GoalType,
            memorySet.TechniqueKey,
            memorySet.Items.Count(x => !x.IsDeleted),
            new CommunityAuthorDto(author.Id, author.DisplayName, author.AvatarUrl),
            memorySet.PublishedAt ?? memorySet.UpdatedAt,
            copyCount,
            helpfulCount,
            isHelpful,
            isBookmarked,
            memorySet.FeaturedAt,
            existingCopyId,
            coverImageUrl);

    public static CommunityMemorySetDetailDto ToDetail(
        MemorySet memorySet,
        User author,
        int copyCount,
        int helpfulCount,
        bool isHelpful,
        bool isBookmarked,
        string? existingCopyId,
        string? coverImageUrl)
    {
        var items = memorySet.Items
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.Position)
            .Select(x => new CommunityMemoryItemDto(
                x.Id, x.Position, x.Prompt, x.Answer, x.Hint, x.PronunciationAudioUrl))
            .ToList();

        var plan = memorySet.TechniquePlan is null || memorySet.TechniquePlan.IsDeleted
            ? null
            : new CommunityTechniquePlanDto(
                memorySet.TechniquePlan.TechniqueKey,
                memorySet.TechniquePlan.SchemaVersion,
                memorySet.TechniquePlan.PalaceSceneId,
                memorySet.TechniquePlan.PegBindings
                    .Where(x => !x.IsDeleted)
                    .OrderBy(x => x.PegNumber)
                    .Select(x => new CommunityPegBindingDto(
                        x.MemoryItemId, x.PegNumber, x.SceneText, DeserializeRecipe(x.SceneRecipeJson)))
                    .ToList(),
                memorySet.TechniquePlan.PalaceBindings
                    .Where(x => !x.IsDeleted)
                    .Select(x => new CommunityPalaceBindingDto(
                        x.MemoryItemId, x.LocusId, x.AssociationText))
                    .ToList());

        var summary = ToSummary(memorySet, author, copyCount, helpfulCount, isHelpful, isBookmarked, existingCopyId, coverImageUrl);
        return new CommunityMemorySetDetailDto(
            summary.Id,
            summary.Title,
            summary.Description,
            summary.GoalType,
            summary.TechniqueKey,
            summary.ItemCount,
            summary.Author,
            summary.PublishedAt,
            summary.CopyCount,
            summary.HelpfulCount,
            summary.IsHelpful,
            summary.IsBookmarked,
            summary.FeaturedAt,
            summary.ExistingCopyId,
            summary.CoverImageUrl,
            items,
            plan);
    }

    private static PegSceneRecipeDto? DeserializeRecipe(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        try { return JsonSerializer.Deserialize<PegSceneRecipeDto>(value); }
        catch (JsonException) { return null; }
    }
}
