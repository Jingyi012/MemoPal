using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;

namespace MemoPal.Application.Features.Education.MemoryBridge;

public sealed record DerivedMemoryContent(string Prompt, string Answer, string? Hint, string LanguageCode);

public sealed class EducationMemoryDerivationRuleException(string reasonCode, string message) : AppException(message, 400)
{
    public string ReasonCode { get; } = reasonCode;
}

public static partial class EducationMemoryDerivationRules
{
    public static DerivedMemoryContent Map(EducationObjective objective, EducationObjectiveStudyItem item)
    {
        var language = item.LanguageCode ?? objective.LanguageCode ?? "zh-Hans";
        string prompt;
        string? answer;
        string? hint = item.Hint;
        switch (item.Kind)
        {
            case EducationMemoryContentType.VocabularyPair:
            case EducationMemoryContentType.NumberDate:
            case EducationMemoryContentType.CategoryMembership:
            case EducationMemoryContentType.FormulaSymbols:
            case EducationMemoryContentType.LabelDiagram:
                prompt = item.Primary;
                answer = item.Secondary;
                break;
            case EducationMemoryContentType.LanguageItem:
                prompt = item.Primary;
                var answerParts = new List<string>();
                if (!string.IsNullOrWhiteSpace(item.Phonetic))
                    answerParts.Add(IsChinese(language) ? $"拼音：{item.Phonetic}" : $"Pronunciation: {item.Phonetic}");
                if (!string.IsNullOrWhiteSpace(item.Secondary))
                    answerParts.Add(IsChinese(language) ? $"释义：{item.Secondary}" : $"Meaning: {item.Secondary}");
                answer = string.Join("\n", answerParts);
                hint = string.IsNullOrWhiteSpace(item.Extra) ? item.Hint : item.Extra;
                break;
            case EducationMemoryContentType.OrderedList:
                prompt = IsChinese(language) ? $"第 {item.Position} 步" : $"Step {item.Position}";
                answer = item.Primary;
                break;
            case EducationMemoryContentType.VerbatimText:
                prompt = IsChinese(language) ? $"第 {item.Position} 句/段" : $"Line/section {item.Position}";
                answer = item.Primary;
                break;
            case EducationMemoryContentType.ConceptUnderstanding:
            case EducationMemoryContentType.ReasoningProcedure:
            case EducationMemoryContentType.NotApplicable:
                throw new EducationMemoryDerivationRuleException("NotSuitableForMemoryTechnique",
                    "This learning objective is not suitable for a memory technique.");
            default:
                throw new EducationMemoryDerivationRuleException("NotSuitableForMemoryTechnique",
                    "This learning objective is not suitable for a memory technique.");
        }

        prompt = NormalizeForMemory(prompt);
        answer = NormalizeForMemory(answer ?? string.Empty);
        hint = string.IsNullOrWhiteSpace(hint) ? null : NormalizeForMemory(hint);
        if (answer.Length == 0)
            throw new EducationMemoryDerivationRuleException("RequiredAnswerMissing", "A published learning item is missing required answer content.");
        // Education validation counts Unicode scalar values; the existing MemorySet aggregate
        // additionally applies its legacy .NET string.Length limit, which we must preserve.
        if (CountRunes(prompt) > 500 || prompt.Length > 500 ||
            CountRunes(answer) > 500 || answer.Length > 500 ||
            hint is not null && (CountRunes(hint) > 500 || hint.Length > 500))
            throw new EducationMemoryDerivationRuleException("MappedFieldTooLong", "Mapped memory content exceeds the supported field length.");
        return new DerivedMemoryContent(prompt, answer, hint, language);
    }

    public static string SourceHash(EducationObjective objective, IReadOnlyCollection<EducationObjectiveStudyItem> items)
    {
        var canonical = items.OrderBy(x => x.Position).ThenBy(x => x.Id, StringComparer.Ordinal)
            .Select(item => new
            {
                item.StableKey,
                item.Position,
                Kind = item.Kind.ToString(),
                Primary = NormalizeForHash(item.Primary),
                Secondary = NormalizeForHash(item.Secondary),
                Phonetic = NormalizeForHash(item.Phonetic),
                Extra = NormalizeForHash(item.Extra),
                Hint = NormalizeForHash(item.Hint),
                Language = NormalizeForHash(item.LanguageCode ?? objective.LanguageCode ?? "zh-Hans")
            }).ToArray();
        return Sha256(JsonSerializer.Serialize(canonical));
    }

    public static string MappedContentHash(string prompt, string answer, string? hint) =>
        Sha256(JsonSerializer.Serialize(new
        {
            Prompt = NormalizeForHash(prompt),
            Answer = NormalizeForHash(answer),
            Hint = NormalizeForHash(hint)
        }));

    public static bool IsSupported(EducationMemoryContentType type) => type is
        EducationMemoryContentType.VocabularyPair or EducationMemoryContentType.OrderedList or
        EducationMemoryContentType.NumberDate or EducationMemoryContentType.FormulaSymbols or
        EducationMemoryContentType.CategoryMembership or EducationMemoryContentType.VerbatimText or
        EducationMemoryContentType.LabelDiagram or EducationMemoryContentType.LanguageItem;

    public static void ValidateCapacity(int itemCount)
    {
        if (itemCount < 1)
            throw new EducationMemoryDerivationRuleException("NoPublishedItems", "There are no published learning items to derive.");
        if (itemCount > 100)
            throw new EducationMemoryDerivationRuleException("TechniqueCapacityExceeded", "The selected technique cannot hold this many items.");
    }

    public static string NormalizeForMemory(string value) =>
        value.Normalize(NormalizationForm.FormC).Replace("\r\n", "\n", StringComparison.Ordinal).Trim();

    public static string NormalizeForHash(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        var normalized = value.Normalize(NormalizationForm.FormC).Replace("\r\n", "\n", StringComparison.Ordinal).Trim();
        return WhitespaceRegex().Replace(normalized, " ");
    }

    public static int CountRunes(string value) => value.EnumerateRunes().Count();

    private static bool IsChinese(string language) => language.StartsWith("zh", StringComparison.OrdinalIgnoreCase);
    private static string Sha256(string value) => Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(value)));

    [GeneratedRegex("\\s+", RegexOptions.CultureInvariant)]
    private static partial Regex WhitespaceRegex();
}
