using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

/// <summary>
/// A reusable image canvas for a Memory Palace. Child loci use normalized
/// percentages so placement remains stable across phones and tablets.
/// </summary>
public sealed class PalaceScene : AuditableBaseEntity
{
    public string? UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string Status { get; set; } = PalaceSceneStatuses.Draft;
    public bool IsTemplate { get; set; }
    public bool IsPremium { get; set; }
    public int Version { get; set; } = 1;

    public ICollection<PalaceLocus> Loci { get; set; } = new List<PalaceLocus>();
}

public static class PalaceSceneStatuses
{
    public const string Draft = "draft";
    public const string Published = "published";
    public const string Archived = "archived";
}
