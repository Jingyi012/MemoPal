using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class PegBinding : AuditableBaseEntity
{
    public string TechniquePlanId { get; set; } = string.Empty;
    public string MemoryItemId { get; set; } = string.Empty;
    public int PegNumber { get; set; }
    public string SceneText { get; set; } = string.Empty;
    /// <summary>Versioned JSON recipe used to replay the scene. SceneText remains the readable fallback.</summary>
    public string? SceneRecipeJson { get; set; }
    public bool IsCustomScene { get; set; }
    public string? SceneAssetUrl { get; set; }

    public TechniquePlan? TechniquePlan { get; set; }
    public MemoryItem? MemoryItem { get; set; }
}
