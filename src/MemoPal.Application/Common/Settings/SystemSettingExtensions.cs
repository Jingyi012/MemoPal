using System.Globalization;
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

    public static async Task<int> GetIntSettingAsync(
        this IAppDbContext db,
        string key,
        int defaultValue,
        CancellationToken cancellationToken = default)
    {
        var normalizedKey = key.Trim();
        var setting = await db.SystemSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(x => !x.IsDeleted && x.Key == normalizedKey, cancellationToken);

        if (setting is null)
        {
            return defaultValue;
        }

        if (!int.TryParse(setting.Value?.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var value))
        {
            return defaultValue;
        }

        return Math.Max(0, value);
    }

    public static Task<int> GetCustomPalaceLimitAsync(
        this IAppDbContext db,
        bool isPremium,
        CancellationToken cancellationToken = default)
    {
        return db.GetIntSettingAsync(
            isPremium ? SystemSettingKeys.CustomPalacesPremium : SystemSettingKeys.CustomPalacesFree,
            isPremium ? SystemSettingDefaults.CustomPalacesPremium : SystemSettingDefaults.CustomPalacesFree,
            cancellationToken);
    }

    public static Task<int> GetCustomLessonsPerPalaceLimitAsync(
        this IAppDbContext db,
        bool isPremium,
        CancellationToken cancellationToken = default)
    {
        return db.GetIntSettingAsync(
            isPremium ? SystemSettingKeys.CustomLessonsPerPalacePremium : SystemSettingKeys.CustomLessonsPerPalaceFree,
            isPremium ? SystemSettingDefaults.CustomLessonsPerPalacePremium : SystemSettingDefaults.CustomLessonsPerPalaceFree,
            cancellationToken);
    }

    public static Task<int> GetCustomLocationsPerPalaceLimitAsync(
        this IAppDbContext db,
        bool isPremium,
        CancellationToken cancellationToken = default)
    {
        return db.GetIntSettingAsync(
            isPremium ? SystemSettingKeys.CustomLocationsPerPalacePremium : SystemSettingKeys.CustomLocationsPerPalaceFree,
            isPremium ? SystemSettingDefaults.CustomLocationsPerPalacePremium : SystemSettingDefaults.CustomLocationsPerPalaceFree,
            cancellationToken);
    }

    public static Task<int> GetCustomWordsPerLessonLimitAsync(
        this IAppDbContext db,
        bool isPremium,
        CancellationToken cancellationToken = default)
    {
        return db.GetIntSettingAsync(
            isPremium ? SystemSettingKeys.CustomWordsPerLessonPremium : SystemSettingKeys.CustomWordsPerLessonFree,
            isPremium ? SystemSettingDefaults.CustomWordsPerLessonPremium : SystemSettingDefaults.CustomWordsPerLessonFree,
            cancellationToken);
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
