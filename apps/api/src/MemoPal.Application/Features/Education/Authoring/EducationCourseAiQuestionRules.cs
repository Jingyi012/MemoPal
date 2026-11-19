using System.Text.RegularExpressions;

namespace MemoPal.Application.Features.Education.Authoring;

internal static class EducationCourseAiQuestionRules
{
    public static string MeaningPrompt(string language, string contentType, string text) => contentType switch
    {
        "ConceptUnderstanding" when language.StartsWith("zh", StringComparison.Ordinal) => $"哪项说明与知识点“{text}”对应？",
        "ConceptUnderstanding" => $"Which explanation is associated with the concept “{text}”?",
        "VerbatimText" when language.StartsWith("zh", StringComparison.Ordinal) => $"哪项说明与这句话“{text}”对应？",
        "VerbatimText" => $"Which explanation is associated with this sentence: “{text}”?",
        _ when language.StartsWith("zh", StringComparison.Ordinal) => $"“{text}”是什么意思？",
        _ => $"What does “{text}” mean?"
    };

    public static string MeaningExplanation(string language, string contentType, string text, string meaning, bool aiSuggested = false) => contentType switch
    {
        "ConceptUnderstanding" when aiSuggested && language.StartsWith("zh", StringComparison.Ordinal) => $"AI 补充说明：“{text}”对应“{meaning}”，请核对来源。",
        "ConceptUnderstanding" when aiSuggested => $"AI suggested this explanation for “{text}”: “{meaning}”. Please verify it against your source.",
        "ConceptUnderstanding" when language.StartsWith("zh", StringComparison.Ordinal) => $"你提供的资料将“{text}”与“{meaning}”对应。",
        "ConceptUnderstanding" => $"Your supplied notes pair “{text}” with “{meaning}”.",
        "VerbatimText" when aiSuggested && language.StartsWith("zh", StringComparison.Ordinal) => $"AI 补充说明：“{text}”对应“{meaning}”，请核对来源。",
        "VerbatimText" when aiSuggested => $"AI suggested this explanation for “{text}”: “{meaning}”. Please verify it against your source.",
        "VerbatimText" when language.StartsWith("zh", StringComparison.Ordinal) => $"你提供的说明与原句“{text}”对应。说明：{meaning}",
        "VerbatimText" => $"Your supplied notes pair the original sentence “{text}” with “{meaning}”.",
        _ when language.StartsWith("zh", StringComparison.Ordinal) => $"“{text}”的意思是“{meaning}”。",
        _ => $"“{text}” means “{meaning}”."
    };

    public static string TrueFalsePrompt(string language, string concept, string statement) => language switch
    {
        "zh-Hans" or "zh-Hant" => $"根据原文，判断这句话是否正确：“{statement}”",
        "ms" => $"Berdasarkan nota, tentukan sama ada pernyataan ini benar: “{statement}”",
        _ => $"According to the source text, is this statement true: “{statement}”?"
    };

    public static string TrueFalseExplanation(string language, string source) => language switch
    {
        "zh-Hans" or "zh-Hant" => $"原文：“{source}”",
        "ms" => $"Petikan asal: “{source}”",
        _ => $"Source text: “{source}”"
    };

    public static bool TryInvertExplicitNegation(string language, string concept, string source, out string statement)
    {
        statement = source;
        if (string.IsNullOrWhiteSpace(concept) || !source.StartsWith(concept, language.StartsWith("zh", StringComparison.Ordinal)
                ? StringComparison.Ordinal : StringComparison.OrdinalIgnoreCase)) return false;
        if (language is "zh-Hans" or "zh-Hant")
        {
            if (new[] { "如果", "只要", "除非", "当", "但是", "然而", "同时", "并且", "或者", "以及", "，", "；", "“", "”", "\"", "'" }.Any(source.Contains)) return false;
            var replacements = new (string Negative, string Positive)[]
            {
                ("不需要", "需要"), ("不属于", "属于"), ("不等于", "等于"), ("不可以", "可以"),
                ("不能", "能"), ("不会", "会"), ("不是", "是"), ("没有", "有")
            };
            var hits = replacements.SelectMany(pair => Occurrences(source, pair.Negative).Select(index => (pair, index))).ToArray();
            if (hits.Length != 1) return false;
            var (found, position) = hits[0];
            if (!string.Equals(source[..position].Trim(), concept, StringComparison.Ordinal)) return false;
            statement = source[..position] + found.Positive + source[(position + found.Negative.Length)..];
            return statement.Length <= 500 && !string.Equals(statement, source, StringComparison.Ordinal);
        }

        if (language != "en") return false;
        if (source.Contains(';') || source.Contains(',') || source.Contains(':') || source.Contains('"') || source.Contains('\'') ||
            Regex.IsMatch(source, @"\b(if|unless|when|although|because|but|however|and|or|while|whereas)\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)) return false;
        var english = new (string Negative, string Positive)[]
        {
            ("does not", "does"), ("do not", "do"), ("is not", "is"), ("are not", "are"),
            ("was not", "was"), ("were not", "were"), ("cannot", "can"), ("can not", "can"), ("will not", "will")
        };
        var matches = english.SelectMany(pair => Regex.Matches(source, $@"\b{Regex.Escape(pair.Negative)}\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)
            .Select(match => (pair, match.Index, match.Length))).ToArray();
        if (matches.Length != 1) return false;
        var selected = matches[0];
        if (!string.Equals(source[..selected.Index].Trim(), concept, StringComparison.OrdinalIgnoreCase)) return false;
        statement = source[..selected.Index] + selected.pair.Positive + source[(selected.Index + selected.Length)..];
        return statement.Length <= 500 && !string.Equals(statement, source, StringComparison.OrdinalIgnoreCase);
    }

    public static bool TrySentenceTokens(string language, string source, out string[] tokens)
    {
        tokens = [];
        if (language is not ("en" or "ms")) return false;
        var split = source.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (split.Length is < 3 or > 10 || split.Any(x => x.Length == 0 || x.Length > 80) ||
            split.Select(x => x.Trim(',', '.', ';', ':', '!', '?', '"', '\'', '(', ')').ToLowerInvariant())
                .Distinct(StringComparer.Ordinal).Count() != split.Length)
            return false;
        tokens = split;
        return true;
    }

    private static IEnumerable<int> Occurrences(string value, string search)
    {
        for (var index = value.IndexOf(search, StringComparison.Ordinal); index >= 0; index = value.IndexOf(search, index + search.Length, StringComparison.Ordinal))
            yield return index;
    }
}
