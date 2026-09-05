namespace MemoPal.Application.Features.PalaceAssociations.DTOs;

public sealed class GeneratePalaceAssociationsRequest
{
    public string Locale { get; set; } = "en";
    public string Style { get; set; } = "playful";
    public bool ChainMode { get; set; }
    public IReadOnlyList<PalaceAssociationItemInput> Items { get; set; } = [];
}

public sealed class PalaceAssociationItemInput
{
    public int Position { get; set; }
    public string Word { get; set; } = string.Empty;
    public string LocusName { get; set; } = string.Empty;
    public string? LocusDescription { get; set; }
}

public sealed record PalaceAssociationSuggestionDto(
    int Position,
    string AssociationText,
    string Action,
    string SensoryDetail);

public sealed record GeneratePalaceAssociationsResponse(
    IReadOnlyList<PalaceAssociationSuggestionDto> Suggestions,
    int RequestedCount,
    int GeneratedCount,
    string Source);
