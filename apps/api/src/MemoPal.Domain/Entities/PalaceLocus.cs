using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class PalaceLocus : AuditableBaseEntity
{
    public string PalaceSceneId { get; set; } = string.Empty;
    public int Position { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    /// <summary>Optional English display name for authored/template loci.</summary>
    public string? NameEn { get; set; }
    /// <summary>Optional Simplified Chinese display name for authored/template loci.</summary>
    public string? NameZh { get; set; }
    /// <summary>Optional English display description for authored/template loci.</summary>
    public string? DescriptionEn { get; set; }
    /// <summary>Optional Simplified Chinese display description for authored/template loci.</summary>
    public string? DescriptionZh { get; set; }
    public decimal XPercent { get; set; }
    public decimal YPercent { get; set; }
    public decimal RadiusPercent { get; set; } = 7m;

    public PalaceScene? PalaceScene { get; set; }
}
