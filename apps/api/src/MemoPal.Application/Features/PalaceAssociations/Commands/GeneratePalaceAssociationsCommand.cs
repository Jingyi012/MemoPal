using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.PalaceAssociations.DTOs;

namespace MemoPal.Application.Features.PalaceAssociations.Commands;

public sealed record GeneratePalaceAssociationsCommand(
    string UserId,
    GeneratePalaceAssociationsRequest Request)
    : IRequest<ApiResponse<GeneratePalaceAssociationsResponse>>;

public sealed class GeneratePalaceAssociationsCommandHandler(
    IPalaceAssociationGenerator generator)
    : IRequestHandler<GeneratePalaceAssociationsCommand, ApiResponse<GeneratePalaceAssociationsResponse>>
{
    public async Task<ApiResponse<GeneratePalaceAssociationsResponse>> Handle(
        GeneratePalaceAssociationsCommand request,
        CancellationToken cancellationToken)
    {
        _ = request.UserId;
        var items = NormalizeAndValidate(request.Request);
        var result = await generator.GenerateAsync(
            items,
            NormalizeLocale(request.Request.Locale),
            NormalizeStyle(request.Request.Style),
            request.Request.ChainMode,
            cancellationToken);

        var suggestions = result.Suggestions
            .OrderBy(x => x.Position)
            .Select(x => new PalaceAssociationSuggestionDto(
                x.Position,
                x.AssociationText,
                x.Action,
                x.SensoryDetail))
            .ToList();

        return ApiResponse<GeneratePalaceAssociationsResponse>.Ok(
            new GeneratePalaceAssociationsResponse(
                suggestions,
                items.Count,
                suggestions.Count,
                result.Source));
    }

    private static IReadOnlyList<PalaceAssociationGenerationItem> NormalizeAndValidate(
        GeneratePalaceAssociationsRequest request)
    {
        if (request.Items is null || request.Items.Count is < 1 or > 100)
        {
            throw new ValidationAppException("Generate between 1 and 100 Palace associations at a time.");
        }

        var positions = new HashSet<int>();
        var items = new List<PalaceAssociationGenerationItem>(request.Items.Count);
        foreach (var item in request.Items.OrderBy(x => x.Position))
        {
            if (item.Position is < 1 or > 100 || !positions.Add(item.Position))
            {
                throw new ValidationAppException("Palace association positions must be unique values from 1 to 100.");
            }

            var word = item.Word?.Trim() ?? string.Empty;
            var locusName = item.LocusName?.Trim() ?? string.Empty;
            var locusDescription = item.LocusDescription?.Trim();
            if (string.IsNullOrWhiteSpace(word) || string.IsNullOrWhiteSpace(locusName))
            {
                throw new ValidationAppException("Every Palace association needs a word and a locus name.");
            }

            if (word.Length > 500 || locusName.Length > 200 || locusDescription?.Length > 500)
            {
                throw new ValidationAppException("Palace association text is too long.");
            }

            items.Add(new PalaceAssociationGenerationItem(item.Position, word, locusName, locusDescription));
        }

        return items;
    }

    private static string NormalizeLocale(string? locale)
    {
        return locale?.Trim().StartsWith("zh", StringComparison.OrdinalIgnoreCase) == true
            ? "zh"
            : "en";
    }

    private static string NormalizeStyle(string? style)
    {
        return string.Equals(style?.Trim(), "vivid", StringComparison.OrdinalIgnoreCase)
            ? "vivid"
            : "playful";
    }
}
