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
