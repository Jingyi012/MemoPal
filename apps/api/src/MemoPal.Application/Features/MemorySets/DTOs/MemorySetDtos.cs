namespace MemoPal.Application.Features.MemorySets.DTOs;

public sealed record MemoryItemDto(
    string Id,
    int Position,
    string Prompt,
    string Answer,
    string? Hint,
    string? PronunciationAudioUrl,
    DateTime CreatedAt,
    string? CreatedBy,
    DateTime UpdatedAt,
    string? UpdatedBy);

public sealed record PegBindingDto(
    string Id,
    string MemoryItemId,
    int PegNumber,
    string SceneText,
    PegSceneRecipeDto? SceneRecipe,
    bool IsCustomScene,
    string? SceneAssetUrl,
    DateTime CreatedAt,
    string? CreatedBy,
    DateTime UpdatedAt,
    string? UpdatedBy);

public sealed record PalaceBindingDto(
    string Id,
    string MemoryItemId,
    string LocusId,
    string AssociationText,
    bool IsCustomScene,
    string? SceneAssetUrl,
    DateTime CreatedAt,
    string? CreatedBy,
    DateTime UpdatedAt,
    string? UpdatedBy);

public sealed record TechniquePlanDto(
    string Id,
    string TechniqueKey,
    int SchemaVersion,
    string? PalaceSceneId,
    IReadOnlyList<PegBindingDto> PegBindings,
    IReadOnlyList<PalaceBindingDto> PalaceBindings,
    DateTime CreatedAt,
    string? CreatedBy,
    DateTime UpdatedAt,
    string? UpdatedBy);

public sealed record MemorySetDto(
    string Id,
    string Title,
    string? Description,
    string? Emoji,
    string GoalType,
    string TechniqueKey,
    string Status,
    string Visibility,
    string? MemoryFolderId,
    int Version,
    IReadOnlyList<MemoryItemDto> Items,
    TechniquePlanDto? TechniquePlan,
    DateTime CreatedAt,
    string? CreatedBy,
    DateTime UpdatedAt,
    string? UpdatedBy);

public sealed class MemorySetUpsertRequest
{
    public string? MemoryFolderId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Emoji { get; set; }
    public string GoalType { get; set; } = "custom";
    public string TechniqueKey { get; set; } = "number-peg";
    public string Status { get; set; } = "draft";
    public string Visibility { get; set; } = "private";
    public int? ExpectedVersion { get; set; }
    public IReadOnlyList<MemoryItemInput> Items { get; set; } = [];
    public TechniquePlanInput? TechniquePlan { get; set; }
}

public sealed class MemoryItemInput
{
    public int Position { get; set; }
    public string Prompt { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public string? Hint { get; set; }
    public string? PronunciationAudioUrl { get; set; }
}

public sealed class TechniquePlanInput
{
    public int SchemaVersion { get; set; } = 1;
    public string? PalaceSceneId { get; set; }
    public IReadOnlyList<PegBindingInput> PegBindings { get; set; } = [];
    public IReadOnlyList<PalaceBindingInput> PalaceBindings { get; set; } = [];
}

public sealed class PegBindingInput
{
    public int ItemPosition { get; set; }
    public int PegNumber { get; set; }
    public string SceneText { get; set; } = string.Empty;
    public PegSceneRecipeDto? SceneRecipe { get; set; }
    public bool IsCustomScene { get; set; }
    public string? SceneAssetUrl { get; set; }
}

public sealed record PegSceneTargetVisualDto(string Kind, string Value);

public sealed record PegSceneAnchorSnapshotDto(
    int PegNumber,
    string CatalogueVersion,
    string Keyword,
    string Image,
    string Description);

public sealed record PegSceneRecipeDto(
    int SchemaVersion,
    string AssociationSource,
    string Caption,
    string ActionPreset,
    string? VisualEffectPreset,
    string? SoundPreset,
    string? HapticPreset,
    IReadOnlyList<string> SensoryBoosters,
    PegSceneTargetVisualDto? TargetVisual,
    PegSceneAnchorSnapshotDto? AnchorSnapshot = null);

public sealed class PalaceBindingInput
{
    public int ItemPosition { get; set; }
    public string LocusId { get; set; } = string.Empty;
    public string AssociationText { get; set; } = string.Empty;
    public bool IsCustomScene { get; set; }
    public string? SceneAssetUrl { get; set; }
}
