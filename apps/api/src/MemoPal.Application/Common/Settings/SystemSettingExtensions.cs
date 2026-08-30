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

    public static async Task<XpAwardConfig> GetXpAwardConfigAsync(
        this IAppDbContext db,
        CancellationToken cancellationToken = default)
    {
        var setting = await db.SystemSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => !x.IsDeleted && x.Key == SystemSettingKeys.XpConfigs,
                cancellationToken);

        return setting is null
            ? XpAwardConfig.Default
            : ParseXpAwardConfig(UnwrapNestedJsonString(setting.Value));
    }

    public static async Task<int> GetXpPerLevelAsync(
        this IAppDbContext db,
        CancellationToken cancellationToken = default)
    {
        var setting = await db.SystemSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => !x.IsDeleted && x.Key == SystemSettingKeys.LevelConfigs,
                cancellationToken);

        return setting is null
            ? LevelProgressConfig.Default.XpPerLevel
            : ParseLevelProgressConfig(UnwrapNestedJsonString(setting.Value)).XpPerLevel;
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

    private static XpAwardConfig ParseXpAwardConfig(string rawJson)
    {
        if (string.IsNullOrWhiteSpace(rawJson))
        {
            return XpAwardConfig.Default;
        }

        try
        {
            var parsed = JsonSerializer.Deserialize<XpAwardConfigPayload>(rawJson, GenericJsonOptions);
            if (parsed is not null &&
                (parsed.MemoryLearnedXp.HasValue || parsed.DueReviewXp.HasValue || parsed.ExtraPracticeXp.HasValue))
            {
                var defaults = XpAwardConfig.Default;
                return new XpAwardConfig(
                    MemoryLearnedXp: ClampReward(parsed.MemoryLearnedXp ?? defaults.MemoryLearnedXp),
                    DueReviewXp: ClampReward(parsed.DueReviewXp ?? defaults.DueReviewXp),
                    ExtraPracticeXp: ClampReward(parsed.ExtraPracticeXp ?? defaults.ExtraPracticeXp),
                    ExtraPracticeDailyLimit: Math.Clamp(
                        parsed.ExtraPracticeDailyLimit ?? defaults.ExtraPracticeDailyLimit,
                        0,
                        10));
            }

            // Existing development databases may still contain the previous
            // array-based configuration. Read its closest matching values so
            // upgrading does not unexpectedly zero out rewards.
            using var doc = JsonDocument.Parse(rawJson);
            var root = doc.RootElement;
            var items = root.ValueKind == JsonValueKind.Array
                ? root
                : TryGetPropertyInsensitive(root, "configs", out var configs) && configs.ValueKind == JsonValueKind.Array
                    ? configs
                    : default;
            if (items.ValueKind != JsonValueKind.Array)
            {
                return XpAwardConfig.Default;
            }

            var legacy = items.EnumerateArray()
                .Where(item => item.ValueKind == JsonValueKind.Object)
                .Select(item => new
                {
                    SourceType = TryGetPropertyInsensitive(item, "sourceType", out var source) ? source.GetString() : null,
                    BaseXp = TryGetPropertyInsensitive(item, "baseXp", out var amount) && amount.TryGetInt32(out var value)
                        ? value
                        : 0
                })
                .ToList();
            var fallback = XpAwardConfig.Default;
            return new XpAwardConfig(
                MemoryLearnedXp: ClampReward(legacy.FirstOrDefault(x => x.SourceType == "lesson_initial_completion")?.BaseXp ?? fallback.MemoryLearnedXp),
                DueReviewXp: ClampReward(legacy.FirstOrDefault(x => x.SourceType == "review_complete")?.BaseXp ?? fallback.DueReviewXp),
                ExtraPracticeXp: fallback.ExtraPracticeXp,
                ExtraPracticeDailyLimit: fallback.ExtraPracticeDailyLimit);
        }
        catch (JsonException)
        {
            return XpAwardConfig.Default;
        }
    }

    private static LevelProgressConfig ParseLevelProgressConfig(string rawJson)
    {
        if (string.IsNullOrWhiteSpace(rawJson))
        {
            return LevelProgressConfig.Default;
        }

        try
        {
            var parsed = JsonSerializer.Deserialize<LevelProgressConfigPayload>(rawJson, GenericJsonOptions);
            return new LevelProgressConfig(Math.Clamp(
                parsed?.XpPerLevel ?? LevelProgressConfig.Default.XpPerLevel,
                10,
                100_000));
        }
        catch (JsonException)
        {
            return LevelProgressConfig.Default;
        }
    }

    public static async Task<int> ResolveLevelByXpAsync(
        this IAppDbContext db,
        int totalXp,
        CancellationToken cancellationToken = default)
    {
        var xpPerLevel = await db.GetXpPerLevelAsync(cancellationToken);
        return ResolveLevelByXp(xpPerLevel, totalXp);
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
        var xpPerLevel = await db.GetXpPerLevelAsync(cancellationToken);
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
            var resolvedLevel = ResolveLevelByXp(xpPerLevel, Math.Max(0, user.TotalXp));
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

    private static int ResolveLevelByXp(int xpPerLevel, int totalXp)
    {
        var safeXp = Math.Max(0, totalXp);
        return checked(safeXp / Math.Max(1, xpPerLevel) + 1);
    }

    private static int ClampReward(int value) => Math.Clamp(value, 0, 10_000);
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

public sealed record XpAwardConfig(
    int MemoryLearnedXp,
    int DueReviewXp,
    int ExtraPracticeXp,
    int ExtraPracticeDailyLimit)
{
    public static XpAwardConfig Default { get; } = new(20, 10, 5, 1);
}

public sealed record LevelProgressConfig(int XpPerLevel)
{
    public static LevelProgressConfig Default { get; } = new(100);
}

internal sealed class XpAwardConfigPayload
{
    public int? MemoryLearnedXp { get; init; }
    public int? DueReviewXp { get; init; }
    public int? ExtraPracticeXp { get; init; }
    public int? ExtraPracticeDailyLimit { get; init; }
}

internal sealed class LevelProgressConfigPayload
{
    public int? XpPerLevel { get; init; }
}
