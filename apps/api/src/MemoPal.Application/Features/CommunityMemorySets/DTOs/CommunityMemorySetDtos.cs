using MemoPal.Application.Features.MemorySets.DTOs;

namespace MemoPal.Application.Features.CommunityMemorySets.DTOs;

public sealed record CommunityAuthorDto(string Id, string DisplayName, string? AvatarUrl);

public sealed record CommunityMemorySetSummaryDto(
    string Id,
    string Title,
    string? Description,
    string GoalType,
    string TechniqueKey,
    int ItemCount,
    CommunityAuthorDto Author,
    DateTime PublishedAt,
    int CopyCount,
    string? ExistingCopyId,
    string? CoverImageUrl);

public sealed record CommunityMemoryItemDto(
    string Id,
    int Position,
    string Prompt,
    string Answer,
    string? Hint,
    string? PronunciationAudioUrl);

public sealed record CommunityPegBindingDto(
    string MemoryItemId,
    int PegNumber,
    string SceneText,
    PegSceneRecipeDto? SceneRecipe);

public sealed record CommunityPalaceBindingDto(
    string MemoryItemId,
    string LocusId,
    string AssociationText);

public sealed record CommunityTechniquePlanDto(
    string TechniqueKey,
    int SchemaVersion,
    string? PalaceSceneId,
    IReadOnlyList<CommunityPegBindingDto> PegBindings,
    IReadOnlyList<CommunityPalaceBindingDto> PalaceBindings);

public sealed record CommunityMemorySetDetailDto(
    string Id,
    string Title,
    string? Description,
    string GoalType,
    string TechniqueKey,
    int ItemCount,
    CommunityAuthorDto Author,
    DateTime PublishedAt,
    int CopyCount,
    string? ExistingCopyId,
    string? CoverImageUrl,
    IReadOnlyList<CommunityMemoryItemDto> Items,
    CommunityTechniquePlanDto? TechniquePlan);

public sealed record CommunityMemorySetCopyDto(MemorySetDto MemorySet, bool AlreadyCopied);

public sealed class UpdateMemorySetVisibilityRequest
{
    public string Visibility { get; set; } = string.Empty;
    public bool ConfirmPrivateAssets { get; set; }
}

public sealed class ReportMemorySetRequest
{
    public string Reason { get; set; } = string.Empty;
    public string? Details { get; set; }
}

public sealed record MemorySetReportDto(string Id, string MemorySetId, string Reason, DateTime CreatedAt);

public sealed record MemorySetReportView(
    string Id,
    string Reason,
    string? Details,
    DateTime CreatedAt);

public sealed record CommunityMemorySetView(
    string Id,
    string Title,
    string? Description,
    string GoalType,
    string TechniqueKey,
    string Visibility,
    string CommunityStatus,
    DateTime? PublishedAt,
    DateTime? HiddenAt,
    string? HiddenReason,
    CommunityAuthorDto Author,
    int ItemCount,
    int CopyCount,
    int ReportCount,
    IReadOnlyList<MemorySetReportView> Reports,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed class HideCommunityMemorySetRequest
{
    public string? Reason { get; set; }
}
