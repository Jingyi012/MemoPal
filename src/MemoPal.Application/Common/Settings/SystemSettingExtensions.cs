using System.Text.Json;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Entities;
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

        var normalizedJson = UnwrapNestedJsonString(setting.Value);
        return ParseLevelConfigsFromJson(normalizedJson);
    }

    private static string UnwrapNestedJsonString(string rawJson)
    {
        var current = rawJson;
        for (var depth = 0; depth < 3; depth++)
        {
            try
            {
                using var doc = JsonDocument.Parse(current);
                if (doc.RootElement.ValueKind != JsonValueKind.String)
                {
                    break;
                }

                var nested = doc.RootElement.GetString();
                if (string.IsNullOrWhiteSpace(nested))
                {
                    break;
                }

                current = nested;
            }
            catch (JsonException)
            {
                break;
            }
        }

        return current;
    }

    private static IReadOnlyList<LevelConfigSettingItem> ParseLevelConfigsFromJson(string rawJson)
    {
        if (string.IsNullOrWhiteSpace(rawJson))
        {
            return [];
        }

        try
        {
            using var doc = JsonDocument.Parse(rawJson);
            var root = doc.RootElement;

            if (root.ValueKind == JsonValueKind.Array)
            {
                var items = JsonSerializer.Deserialize<List<LevelConfigSettingItem>>(rawJson, GenericJsonOptions) ?? [];
                return NormalizeLevelConfigItems(items);
            }

            if (root.ValueKind == JsonValueKind.Object)
            {
                var wrapped = JsonSerializer.Deserialize<LevelConfigSettingPayload>(rawJson, GenericJsonOptions);
                var wrappedItems = wrapped?.Levels ?? wrapped?.Configs;
                if (wrappedItems is { Count: > 0 })
                {
                    return NormalizeLevelConfigItems(wrappedItems);
                }

                if (TryGetPropertyInsensitive(root, "items", out var itemsElement) &&
                    itemsElement.ValueKind == JsonValueKind.Array)
                {
                    var items = JsonSerializer.Deserialize<List<LevelConfigSettingItem>>(
                        itemsElement.GetRawText(),
                        GenericJsonOptions) ?? [];
                    return NormalizeLevelConfigItems(items);
                }
            }

            return [];
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static IReadOnlyList<LevelConfigSettingItem> NormalizeLevelConfigItems(
        IEnumerable<LevelConfigSettingItem> items)
    {
        return items
            .Where(x => x.Level > 0)
            .OrderBy(x => x.RequiredXp)
            .ThenBy(x => x.Level)
            .ToList();
    }

    public static async Task<int> ResolveLevelByXpAsync(
        this IAppDbContext db,
        int totalXp,
        CancellationToken cancellationToken = default)
    {
        var configs = await db.GetLevelConfigsAsync(cancellationToken);
        return ResolveLevelByXp(configs, totalXp);
    }

    public static async Task<bool> EnsureUserLevelMatchesXpAsync(
        this IAppDbContext db,
        User user,
        CancellationToken cancellationToken = default)
    {
        var resolvedLevel = await db.ResolveLevelByXpAsync(Math.Max(0, user.TotalXp), cancellationToken);
        if (user.Level == resolvedLevel)
        {
            return false;
        }

        user.Level = resolvedLevel;
        user.UpdatedAt = DateTime.UtcNow;
        return true;
    }

    public static async Task<int> RecalculateAllUserLevelsAsync(
        this IAppDbContext db,
        CancellationToken cancellationToken = default)
    {
        var configs = await db.GetLevelConfigsAsync(cancellationToken);
        var users = await db.Users
            .Where(x => !x.IsDeleted)
            .ToListAsync(cancellationToken);

        if (users.Count == 0)
        {
            return 0;
        }

        var now = DateTime.UtcNow;
        var updatedCount = 0;
        foreach (var user in users)
        {
            var resolvedLevel = ResolveLevelByXp(configs, Math.Max(0, user.TotalXp));
            if (user.Level == resolvedLevel)
            {
                continue;
            }

            user.Level = resolvedLevel;
            user.UpdatedAt = now;
            updatedCount++;
        }

        return updatedCount;
    }

    private static int ResolveLevelByXp(IReadOnlyList<LevelConfigSettingItem> configs, int totalXp)
    {
        if (configs.Count == 0)
        {
            return 1;
        }

        var safeXp = Math.Max(0, totalXp);
        var resolved = configs
            .Where(x => x.RequiredXp <= safeXp)
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
