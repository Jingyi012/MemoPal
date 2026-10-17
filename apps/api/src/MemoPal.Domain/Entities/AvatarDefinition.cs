using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

/// <summary>
/// A curated illustrated companion that a player can unlock and equip.
/// AssetKey points at a bundled client asset; ImageUrl is optional for admin-uploaded artwork.
/// </summary>
public sealed class AvatarDefinition : AuditableBaseEntity
{
    public string Key { get; set; } = string.Empty;
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
