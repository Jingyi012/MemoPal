namespace MemoPal.Application.Common.Interfaces;

public sealed record PalaceAssociationGenerationItem(
    int Position,
    string Word,
    string LocusName,
    string? LocusDescription);

public sealed record PalaceAssociationGenerationSuggestion(
    int Position,
    string AssociationText,
    string Action,
    string SensoryDetail);

public sealed record PalaceAssociationGenerationResult(
    IReadOnlyList<PalaceAssociationGenerationSuggestion> Suggestions,
    string Source);

public interface IPalaceAssociationGenerator
{
    Task<PalaceAssociationGenerationResult> GenerateAsync(
        IReadOnlyList<PalaceAssociationGenerationItem> items,
        string locale,
        string style,
        bool chainMode,
        CancellationToken cancellationToken = default);
}
