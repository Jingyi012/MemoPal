namespace MemoPal.Application.Features.PalaceScenes.DTOs;

public sealed record PalaceLocusDto(
    string Id,
    int Position,
    string Name,
    string? Description,
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
    bool IsTemplate,
    bool IsPremium,
    int Version,
    IReadOnlyList<PalaceLocusDto> Loci,
    DateTime CreatedAt,
    string? CreatedBy,
    DateTime UpdatedAt,
    string? UpdatedBy);
