namespace MemoPal.Application.Features.PalaceScenes.DTOs;

public sealed record PalaceLocusDto(
    string Id,
    int Position,
    string Name,
    string? Description,
    string? NameEn,
    string? NameZh,
    string? DescriptionEn,
    string? DescriptionZh,
    decimal XPercent,
    decimal YPercent,
    decimal RadiusPercent,
    DateTime CreatedAt,
    string? CreatedBy,
    DateTime UpdatedAt,
    string? UpdatedBy);

public sealed record PalaceSceneDto(
    string Id,
    string Name,
    string Description,
    string ImageUrl,
    string Status,
    bool IsTemplate,
    bool IsPremium,
    int UnlockLevel,
    int Version,
    IReadOnlyList<PalaceLocusDto> Loci,
    DateTime CreatedAt,
    string? CreatedBy,
    DateTime UpdatedAt,
    string? UpdatedBy);

public sealed class PalaceSceneUpsertRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string Status { get; set; } = "draft";
    public bool IsPremium { get; set; }
    public int UnlockLevel { get; set; } = 1;
    public int? ExpectedVersion { get; set; }
    public IReadOnlyList<PalaceLocusInput> Loci { get; set; } = [];
}

public sealed class PalaceLocusInput
{
    public string? Id { get; set; }
    public int Position { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? NameEn { get; set; }
    public string? NameZh { get; set; }
    public string? DescriptionEn { get; set; }
    public string? DescriptionZh { get; set; }
    public decimal XPercent { get; set; }
    public decimal YPercent { get; set; }
    public decimal RadiusPercent { get; set; } = 7m;
}
