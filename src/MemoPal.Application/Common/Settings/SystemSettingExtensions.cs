using System.Text.Json;
using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Common.Settings;

public static class SystemSettingExtensions
{
    private static readonly JsonSerializerOptions AuthLoginMethodsJsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };
    private static readonly JsonSerializerOptions GenericJsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly record struct FeatureLimitTier(int Free, int Premium);

    private readonly record struct FeatureLimitsConfig(
        FeatureLimitTier CustomPalaces,
        FeatureLimitTier CustomLessonsPerPalace,
        FeatureLimitTier CustomLocationsPerPalace,
        FeatureLimitTier CustomWordsPerLesson)
    {
        public static FeatureLimitsConfig Default => new(
            CustomPalaces: new FeatureLimitTier(
                SystemSettingDefaults.CustomPalacesFree,
                SystemSettingDefaults.CustomPalacesPremium),
            CustomLessonsPerPalace: new FeatureLimitTier(
                SystemSettingDefaults.CustomLessonsPerPalaceFree,
                SystemSettingDefaults.CustomLessonsPerPalacePremium),
            CustomLocationsPerPalace: new FeatureLimitTier(
                SystemSettingDefaults.CustomLocationsPerPalaceFree,
                SystemSettingDefaults.CustomLocationsPerPalacePremium),
            CustomWordsPerLesson: new FeatureLimitTier(
                SystemSettingDefaults.CustomWordsPerLessonFree,
                SystemSettingDefaults.CustomWordsPerLessonPremium));
    }

    private static bool TryGetPropertyInsensitive(JsonElement element, string propertyName, out JsonElement value)
    {
        foreach (var property in element.EnumerateObject())
        {
            if (string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
            {
                value = property.Value;
                return true;
            }
        }

        value = default;
        return false;
    }

    private static int ParseTierValue(JsonElement tierElement, string key, int fallback)
    {
        if (!TryGetPropertyInsensitive(tierElement, key, out var valueElement))
        {
            return fallback;
        }

        if (valueElement.ValueKind == JsonValueKind.Number && valueElement.TryGetInt32(out var intValue))
        {
            return Math.Max(0, intValue);
        }

        if (valueElement.ValueKind == JsonValueKind.String &&
            int.TryParse(valueElement.GetString(), out var stringValue))
        {
            return Math.Max(0, stringValue);
        }

        return fallback;
    }

    private static FeatureLimitTier ParseTier(
        JsonElement root,
        string camelKey,
        string snakeKey,
        FeatureLimitTier fallback)
    {
        if (!TryGetPropertyInsensitive(root, camelKey, out var tierElement) &&
            !TryGetPropertyInsensitive(root, snakeKey, out tierElement))
        {
            return fallback;
        }

        if (tierElement.ValueKind != JsonValueKind.Object)
        {
            return fallback;
        }

        var free = ParseTierValue(tierElement, "free", fallback.Free);
        var premium = ParseTierValue(tierElement, "premium", fallback.Premium);
        return new FeatureLimitTier(free, premium);
    }

    private static FeatureLimitsConfig ParseFeatureLimitsConfigFromElement(JsonElement root)
    {
        var fallback = FeatureLimitsConfig.Default;
        if (root.ValueKind != JsonValueKind.Object)
        {
            return fallback;
        }

        return new FeatureLimitsConfig(
            CustomPalaces: ParseTier(root, "customPalaces", "custom_palaces", fallback.CustomPalaces),
            CustomLessonsPerPalace: ParseTier(
                root,
                "customLessonsPerPalace",
                "custom_lessons_per_palace",
                fallback.CustomLessonsPerPalace),
            CustomLocationsPerPalace: ParseTier(
                root,
                "customLocationsPerPalace",
                "custom_locations_per_palace",
                fallback.CustomLocationsPerPalace),
            CustomWordsPerLesson: ParseTier(
                root,
                "customWordsPerLesson",
                "custom_words_per_lesson",
                fallback.CustomWordsPerLesson));
    }

    private static FeatureLimitsConfig ParseFeatureLimitsConfig(string rawJson)
    {
        var fallback = FeatureLimitsConfig.Default;

        if (string.IsNullOrWhiteSpace(rawJson))
        {
            return fallback;
        }

        try
        {
            using var doc = JsonDocument.Parse(rawJson);

            var root = doc.RootElement;
            if (root.ValueKind == JsonValueKind.String)
            {
                var nested = root.GetString();
                if (string.IsNullOrWhiteSpace(nested))
                {
                    return fallback;
                }

                using var nestedDoc = JsonDocument.Parse(nested);
                return ParseFeatureLimitsConfigFromElement(nestedDoc.RootElement);
            }

            return ParseFeatureLimitsConfigFromElement(root);
        }
        catch (JsonException)
        {
            return fallback;
        }
    }

    private static async Task<FeatureLimitsConfig> GetFeatureLimitsConfigAsync(
        this IAppDbContext db,
        CancellationToken cancellationToken = default)
    {
        var setting = await db.SystemSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => !x.IsDeleted && x.Key == SystemSettingKeys.FeatureLimits,
                cancellationToken);

        return setting is null
            ? FeatureLimitsConfig.Default
            : ParseFeatureLimitsConfig(setting.Value);
    }

    public static Task<int> GetCustomPalaceLimitAsync(
        this IAppDbContext db,
        bool isPremium,
        CancellationToken cancellationToken = default)
    {
        return ResolveLimitAsync(
            db,
            isPremium,
            config => config.CustomPalaces,
            cancellationToken);
    }

    public static Task<int> GetCustomLessonsPerPalaceLimitAsync(
        this IAppDbContext db,
        bool isPremium,
        CancellationToken cancellationToken = default)
    {
        return ResolveLimitAsync(
            db,
            isPremium,
            config => config.CustomLessonsPerPalace,
            cancellationToken);
    }

    public static Task<int> GetCustomLocationsPerPalaceLimitAsync(
        this IAppDbContext db,
        bool isPremium,
        CancellationToken cancellationToken = default)
    {
        return ResolveLimitAsync(
            db,
            isPremium,
            config => config.CustomLocationsPerPalace,
            cancellationToken);
    }

    public static Task<int> GetCustomWordsPerLessonLimitAsync(
        this IAppDbContext db,
        bool isPremium,
        CancellationToken cancellationToken = default)
    {
        return ResolveLimitAsync(
            db,
            isPremium,
            config => config.CustomWordsPerLesson,
            cancellationToken);
    }

    private static async Task<int> ResolveLimitAsync(
        IAppDbContext db,
        bool isPremium,
        Func<FeatureLimitsConfig, FeatureLimitTier> selector,
        CancellationToken cancellationToken)
    {
        var config = await db.GetFeatureLimitsConfigAsync(cancellationToken);
        var tier = selector(config);
        return isPremium ? tier.Premium : tier.Free;
    }

    public static async Task<AuthLoginMethodsConfig> GetAuthLoginMethodsAsync(
        this IAppDbContext db,
        CancellationToken cancellationToken = default)
    {
        var setting = await db.SystemSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => !x.IsDeleted && x.Key == SystemSettingKeys.AuthLoginMethods,
                cancellationToken);

        if (setting is null || string.IsNullOrWhiteSpace(setting.Value))
        {
            return AuthLoginMethodsConfig.Default;
        }

        try
        {
            var payload = JsonSerializer.Deserialize<AuthLoginMethodsPayload>(
                setting.Value,
                AuthLoginMethodsJsonOptions);

            if (payload is null)
            {
                return AuthLoginMethodsConfig.Default;
            }

            var defaults = AuthLoginMethodsConfig.Default;
            return new AuthLoginMethodsConfig(
                EmailPassword: payload.EmailPassword ?? defaults.EmailPassword,
                Google: payload.Google ?? defaults.Google,
                Facebook: payload.Facebook ?? defaults.Facebook);
        }
        catch (JsonException)
        {
            return AuthLoginMethodsConfig.Default;
        }
    }

    public static async Task<IReadOnlyList<LevelConfigSettingItem>> GetLevelConfigsAsync(
        this IAppDbContext db,
        CancellationToken cancellationToken = default)
    {
        var setting = await db.SystemSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => !x.IsDeleted && x.Key == SystemSettingKeys.LevelConfigs,
                cancellationToken);

        if (setting is null || string.IsNullOrWhiteSpace(setting.Value))
        {
            return [];
        }

        try
        {
            var payload = JsonSerializer.Deserialize<List<LevelConfigSettingItem>>(
                setting.Value,
                GenericJsonOptions);

            if (payload is not null && payload.Count > 0)
            {
                return payload
                    .Where(x => x.Level > 0)
                    .OrderBy(x => x.RequiredXp)
                    .ThenBy(x => x.Level)
                    .ToList();
            }

            var wrapped = JsonSerializer.Deserialize<LevelConfigSettingPayload>(
                setting.Value,
                GenericJsonOptions);

            var items = wrapped?.Levels ?? wrapped?.Configs ?? [];
            return items
                .Where(x => x.Level > 0)
                .OrderBy(x => x.RequiredXp)
                .ThenBy(x => x.Level)
                .ToList();
        }
        catch (JsonException)
        {
            return [];
        }
    }

    public static async Task<int> ResolveLevelByXpAsync(
        this IAppDbContext db,
        int totalXp,
        CancellationToken cancellationToken = default)
    {
        var configs = await db.GetLevelConfigsAsync(cancellationToken);
        if (configs.Count == 0)
        {
            return 1;
        }

        var resolved = configs
            .Where(x => x.RequiredXp <= totalXp)
            .OrderByDescending(x => x.RequiredXp)
            .ThenByDescending(x => x.Level)
            .Select(x => x.Level)
            .FirstOrDefault();

        return resolved <= 0 ? 1 : resolved;
    }
}

public sealed record AuthLoginMethodsConfig(
    bool EmailPassword,
    bool Google,
    bool Facebook)
{
    public static AuthLoginMethodsConfig Default { get; } = new(
        EmailPassword: true,
        Google: true,
        Facebook: false);
}

internal sealed class AuthLoginMethodsPayload
{
    public bool? EmailPassword { get; init; }
    public bool? Google { get; init; }
    public bool? Facebook { get; init; }
}

public sealed class LevelConfigSettingItem
{
    public int Level { get; init; }
    public int RequiredXp { get; init; }
    public string? Title { get; init; }
    public DateTime? CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

internal sealed class LevelConfigSettingPayload
{
    public List<LevelConfigSettingItem>? Levels { get; init; }
    public List<LevelConfigSettingItem>? Configs { get; init; }
}
