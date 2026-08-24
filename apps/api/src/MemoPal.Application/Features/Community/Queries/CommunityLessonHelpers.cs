using System.Text.Json;

namespace MemoPal.Application.Features.Community.Queries;

internal static class CommunityLessonHelpers
{
    public static string[] ParseTags(string? tagJson)
    {
        if (string.IsNullOrWhiteSpace(tagJson))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<string[]>(tagJson) ?? [];
        }
        catch
        {
            return [];
        }
    }

    public static string BuildShareCode(string lessonId)
    {
        var normalized = NormalizeShareCode(lessonId);
        if (normalized.Length == 0)
        {
            return "LESSON";
        }

        return normalized.Length <= 8 ? normalized : normalized[..8];
    }

    public static string NormalizeShareCode(string value)
    {
        return (value ?? string.Empty)
            .Trim()
            .Replace("-", string.Empty, StringComparison.Ordinal)
            .Replace(" ", string.Empty, StringComparison.Ordinal)
            .ToUpperInvariant();
    }
}
