using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

/// <summary>
/// A cosmetic layer that can be equipped on top of a memory companion.
/// AssetKey points to a bundled mobile asset; ImageUrl is optional for admin-uploaded artwork.
/// </summary>
public sealed class AppearanceDefinition : AuditableBaseEntity
{
    public string Key { get; set; } = string.Empty;
    public string ItemType { get; set; } = AppearanceItemTypes.Frame;
    public string AssetKey { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string TitleEn { get; set; } = string.Empty;
    public string TitleZh { get; set; } = string.Empty;
    public string DescriptionEn { get; set; } = string.Empty;
    public string DescriptionZh { get; set; } = string.Empty;
    public int RequiredLevel { get; set; } = 1;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public static class AppearanceItemTypes
{
    public const string Frame = "frame";
    public const string Decoration = "decoration";
    public const string Outfit = "outfit";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal)
    {
        Frame,
        Decoration,
        Outfit,
    };
}
