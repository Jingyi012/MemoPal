using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using MemoPal.Domain.Education;

namespace MemoPal.Application.Features.Education.StudyItems;

public static partial class EducationStudyItemValidation
{
    private static readonly HashSet<string> LanguageCodes = ["zh-Hans", "en", "zh-Hant", "ms"];
    private static readonly HashSet<int> ZeroWidth = [0x200B, 0x200C, 0x200D, 0x2060, 0xFEFF, 0xFE0E, 0xFE0F];
    [GeneratedRegex("^[A-Z]{2,8}-[A-Z]{1,8}[1-9][0-9]?$", RegexOptions.CultureInvariant)]
    private static partial Regex GradeCodeRegex();
    [GeneratedRegex("^media:[A-Za-z0-9_-]{1,128}$", RegexOptions.CultureInvariant)]
    private static partial Regex MediaRefRegex();

    public static T ParseEnum<T>(string? value, string field) where T : struct, Enum
    {
        if (string.IsNullOrWhiteSpace(value) || !Enum.TryParse<T>(value.Trim(), true, out var parsed) || !Enum.IsDefined(parsed))
            throw new ValidationAppException($"{field} is invalid.");
        return parsed;
    }

    public static string? Language(string? value, string field = "LanguageCode")
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var normalized = Clean(value, 16, field, false);
        if (!LanguageCodes.Contains(normalized)) throw new ValidationAppException($"{field} must be one of: zh-Hans, en, zh-Hant, ms.");
        return normalized;
    }

    public static string? GradeCode(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var normalized = Clean(value, 32, "GradeCode", false).ToUpperInvariant();
        if (!GradeCodeRegex().IsMatch(normalized)) throw new ValidationAppException("GradeCode must match <REGION>-<LEVEL><NUMBER>, such as MY-P1 or MY-F1.");
        if (normalized.StartsWith("MY-P", StringComparison.Ordinal) &&
            (!int.TryParse(normalized.AsSpan(4), out var primaryYear) || primaryYear is < 1 or > 6))
            throw new ValidationAppException("Malaysia primary GradeCode must be MY-P1 through MY-P6.");
        if (normalized.StartsWith("MY-F", StringComparison.Ordinal) &&
            (!int.TryParse(normalized.AsSpan(4), out var secondaryYear) || secondaryYear is < 1 or > 5))
            throw new ValidationAppException("Malaysia secondary GradeCode must be MY-F1 through MY-F5.");
        return normalized;
    }

    public static string? ShortCode(string? value, string field, int max = 64) =>
        string.IsNullOrWhiteSpace(value) ? null : Clean(value, max, field, false);

    public static EducationObjectiveStudyItemRequest Normalize(EducationObjectiveStudyItemRequest request)
    {
        var stableKey = string.IsNullOrWhiteSpace(request.StableKey) ? null : Clean(request.StableKey, 80, "StableKey", false);
        var kind = ParseEnum<EducationMemoryContentType>(request.Kind, "Kind");
        var primary = Clean(request.Primary, 500, "Primary", true);
        if (string.IsNullOrWhiteSpace(primary)) throw new ValidationAppException("Primary is required.");
        var secondary = Optional(request.Secondary, 500, "Secondary");
        var phonetic = Optional(request.Phonetic, 200, "Phonetic");
        var extra = Optional(request.Extra, 300, "Extra");
        var hint = Optional(request.Hint, 200, "Hint");
        var mediaRef = Optional(request.MediaRef, 140, "MediaRef");
        if (mediaRef is not null && !MediaRefRegex().IsMatch(mediaRef))
            throw new ValidationAppException("MediaRef must use media:<opaque-id> format.");
        if (mediaRef is not null && mediaRef.StartsWith("media:learning-", StringComparison.Ordinal) &&
            EducationStudyIllustrations.FromMediaReference(mediaRef) is null)
            throw new ValidationAppException("MediaRef contains an unsupported teaching diagram or invalid parameters.");
        var language = Language(request.LanguageCode, "LanguageCode");
        if (request.Position < 1 || request.Position > 100) throw new ValidationAppException("Position must be between 1 and 100.");
        return new(stableKey, request.Position, kind.ToString(), primary, secondary, phonetic, extra, hint, mediaRef, language);
    }

    public static string StableKey(EducationObjectiveStudyItemRequest request)
    {
        if (!string.IsNullOrWhiteSpace(request.StableKey)) return request.StableKey.Trim();
        var material = string.Join('\u001f', request.Kind, request.Primary, request.Secondary, request.Phonetic,
            request.Extra, request.Hint, request.MediaRef, request.LanguageCode);
        return "sha256:" + Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(material))).ToLowerInvariant();
    }

    public static string Clean(string? input, int maxCodePoints, string field, bool required)
    {
        if (input is null) input = string.Empty;
        var value = input.Normalize(NormalizationForm.FormC).Trim();
        foreach (var rune in value.EnumerateRunes())
        {
            if (ZeroWidth.Contains(rune.Value) || (Rune.IsControl(rune) && rune.Value is not ('\r' or '\n')))
                throw new ValidationAppException($"{field} contains a forbidden control or zero-width character.");
        }
        if (required && string.IsNullOrWhiteSpace(value)) throw new ValidationAppException($"{field} is required.");
        if (value.EnumerateRunes().Count() > maxCodePoints) throw new ValidationAppException($"{field} must be {maxCodePoints} Unicode code points or fewer.");
        return value;
    }

    private static string? Optional(string? value, int max, string field) =>
        string.IsNullOrWhiteSpace(value) ? null : Clean(value, max, field, false);
}
