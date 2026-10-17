using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.SystemSettings.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace MemoPal.Application.Features.SystemSettings.Commands;

public sealed record UpsertSystemSettingCommand(UpsertSystemSettingRequest Request)
    : IRequest<ApiResponse<SystemSettingDto>>;

public sealed class UpsertSystemSettingCommandHandler
    : IRequestHandler<UpsertSystemSettingCommand, ApiResponse<SystemSettingDto>>
{
    private readonly IAppDbContext _db;

    public UpsertSystemSettingCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<SystemSettingDto>> Handle(UpsertSystemSettingCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Request.Key))
            return ApiResponse<SystemSettingDto>.Fail("Key is required.");

        var key = request.Request.Key.Trim();
        var normalizedValue = request.Request.Value ?? string.Empty;
        if (key.StartsWith("ai.", StringComparison.OrdinalIgnoreCase))
        {
            if (key is not (AiSettings.Text or AiSettings.Images or AiSettings.Credits))
                return ApiResponse<SystemSettingDto>.Fail("Unknown AI settings key.");
            try { AiSettings.Validate(key, normalizedValue); }
            catch (Exception ex) when (ex is JsonException or ArgumentException or InvalidOperationException)
            { return ApiResponse<SystemSettingDto>.Fail("Invalid AI configuration. Check provider, fields, URLs, costs and limits."); }
        }
        if (string.Equals(key, SystemSettingKeys.LevelConfigs, StringComparison.Ordinal))
        {
            normalizedValue = NormalizeLevelConfigValue(normalizedValue);
        }
        else if (string.Equals(key, SystemSettingKeys.XpConfigs, StringComparison.Ordinal))
        {
            normalizedValue = NormalizeXpConfigValue(normalizedValue);
        }
        else if (string.Equals(key, SystemSettingKeys.NumberPegDefinitions, StringComparison.Ordinal))
        {
            normalizedValue = NormalizeNumberPegDefinitionsValue(normalizedValue);
        }

        var entity = await _db.SystemSettings.FirstOrDefaultAsync(x => x.Key == key, cancellationToken);

        if (entity is null)
        {
            entity = new SystemSetting
            {
                Id = Guid.NewGuid().ToString("N"),
                Key = key,
                Value = normalizedValue,
                Description = request.Request.Description,
            };
            _db.SystemSettings.Add(entity);
        }
        else
        {
            entity.Value = normalizedValue;
            entity.Description = request.Request.Description;
            entity.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(cancellationToken);

        if (string.Equals(key, SystemSettingKeys.LevelConfigs, StringComparison.Ordinal))
        {
            var updatedUsers = await _db.RecalculateAllUserLevelsAsync(cancellationToken);
            if (updatedUsers > 0)
            {
                await _db.SaveChangesAsync(cancellationToken);
            }
        }

        return ApiResponse<SystemSettingDto>.Ok(new SystemSettingDto(
            entity.Id,
            entity.Key,
            entity.Value,
            entity.Description,
            entity.CreatedAt,
            entity.UpdatedAt
        ));
    }

    private static string NormalizeLevelConfigValue(string rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            return JsonSerializer.Serialize(new { xpPerLevel = LevelProgressConfig.Default.XpPerLevel });
        }

        try
        {
            var root = UnwrapJsonObject(rawValue);
            var xpPerLevel = Math.Clamp(
                ToInt(root?["xpPerLevel"], LevelProgressConfig.Default.XpPerLevel),
                10,
                100_000);
            var levelTitles = new JsonArray();
            if (root?["levelTitles"] is JsonArray source)
            {
                var normalizedTitles = source
                    .OfType<JsonObject>()
                    .Select(item => new
                    {
                        level = ToInt(item["level"]),
                        titleEn = ToText(item["titleEn"]),
                        titleZh = ToText(item["titleZh"]),
                    })
                    .Where(item => item.level >= 1 &&
                                   !string.IsNullOrWhiteSpace(item.titleEn) &&
                                   !string.IsNullOrWhiteSpace(item.titleZh))
                    .GroupBy(item => item.level)
                    .Select(group => group.First())
                    .OrderBy(item => item.level);

                foreach (var title in normalizedTitles)
                {
                    levelTitles.Add(new JsonObject
                    {
                        ["level"] = title.level,
                        ["titleEn"] = title.titleEn,
                        ["titleZh"] = title.titleZh,
                    });
                }
            }

            var avatarRewards = new List<LevelAvatarRewardConfig>();
            if (root?["avatarRewards"] is JsonArray avatarSource)
            {
                var normalizedAvatarRewards = avatarSource
                    .OfType<JsonObject>()
                    .Select(item => new LevelAvatarRewardConfig(
                        Id: ToText(item["id"], 40),
                        RequiredLevel: ToInt(item["requiredLevel"]),
                        TitleEn: ToText(item["titleEn"]),
                        TitleZh: ToText(item["titleZh"]),
                        DescriptionEn: ToText(item["descriptionEn"], 160),
                        DescriptionZh: ToText(item["descriptionZh"], 160),
                        Icon: ToText(item["icon"], 40),
                        Emoji: ToText(item["emoji"], 8),
                        GradientStart: ToText(item["gradientStart"], 7),
                        GradientEnd: ToText(item["gradientEnd"], 7)))
                    .Where(item => item.RequiredLevel >= 1 &&
                                   !string.IsNullOrWhiteSpace(item.Id) &&
                                   !string.IsNullOrWhiteSpace(item.TitleEn) &&
                                   !string.IsNullOrWhiteSpace(item.TitleZh) &&
                                   !string.IsNullOrWhiteSpace(item.Icon) &&
                                   !string.IsNullOrWhiteSpace(item.Emoji) &&
                                   IsHexColor(item.GradientStart) &&
                                   IsHexColor(item.GradientEnd))
                    .GroupBy(item => item.Id, StringComparer.OrdinalIgnoreCase)
                    .Select(group => group.First())
                    .OrderBy(item => item.RequiredLevel);

                avatarRewards.AddRange(normalizedAvatarRewards);
            }

            if (avatarRewards.Count == 0)
            {
                avatarRewards = LevelProgressConfigDefaults.AvatarRewards.ToList();
            }

            return JsonSerializer.Serialize(new
            {
                xpPerLevel,
                levelTitles,
                avatarRewards = avatarRewards.Select(item => new
                {
                    id = item.Id,
                    requiredLevel = item.RequiredLevel,
                    titleEn = item.TitleEn,
                    titleZh = item.TitleZh,
                    descriptionEn = item.DescriptionEn,
                    descriptionZh = item.DescriptionZh,
                    icon = item.Icon,
                    emoji = item.Emoji,
                    gradientStart = item.GradientStart,
                    gradientEnd = item.GradientEnd,
                }),
            });
        }
        catch
        {
            return JsonSerializer.Serialize(new { xpPerLevel = LevelProgressConfig.Default.XpPerLevel });
        }
    }

    private static string NormalizeXpConfigValue(string rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            return SerializeDefaultXpConfig();
        }

        try
        {
            var root = UnwrapJsonObject(rawValue);
            var defaults = XpAwardConfig.Default;
            return JsonSerializer.Serialize(new
            {
                memoryLearnedXp = ClampReward(ToInt(root?["memoryLearnedXp"], defaults.MemoryLearnedXp)),
                dueReviewXp = ClampReward(ToInt(root?["dueReviewXp"], defaults.DueReviewXp)),
                extraPracticeXp = ClampReward(ToInt(root?["extraPracticeXp"], defaults.ExtraPracticeXp)),
                extraPracticeDailyLimit = Math.Clamp(
                    ToInt(root?["extraPracticeDailyLimit"], defaults.ExtraPracticeDailyLimit),
                    0,
                    10),
            });
        }
        catch
        {
            return SerializeDefaultXpConfig();
        }
    }

    private static string SerializeDefaultXpConfig()
    {
        var defaults = XpAwardConfig.Default;
        return JsonSerializer.Serialize(new
        {
            memoryLearnedXp = defaults.MemoryLearnedXp,
            dueReviewXp = defaults.DueReviewXp,
            extraPracticeXp = defaults.ExtraPracticeXp,
            extraPracticeDailyLimit = defaults.ExtraPracticeDailyLimit,
        });
    }

    private static JsonObject? UnwrapJsonObject(string rawValue)
    {
        JsonNode? root = JsonNode.Parse(rawValue);
        for (var i = 0; i < 3; i++)
        {
            if (root is not JsonValue valueNode || !valueNode.TryGetValue<string>(out var nestedJson))
            {
                break;
            }

            if (string.IsNullOrWhiteSpace(nestedJson))
            {
                break;
            }

            root = JsonNode.Parse(nestedJson);
        }

        return root as JsonObject;
    }

    private static int ToInt(JsonNode? node, int fallback = 0)
    {
        if (node is null) return fallback;

        if (node is JsonValue valueNode)
        {
            if (valueNode.TryGetValue<int>(out var intValue))
            {
                return intValue;
            }

            if (valueNode.TryGetValue<long>(out var longValue))
            {
                return (int)Math.Clamp(longValue, int.MinValue, int.MaxValue);
            }

            if (valueNode.TryGetValue<string>(out var stringValue) &&
                int.TryParse(stringValue, out var parsedString))
            {
                return parsedString;
            }
        }

        return fallback;
    }

    private static string ToText(JsonNode? node, int maxLength = 80)
    {
        if (node is JsonValue valueNode && valueNode.TryGetValue<string>(out var textValue))
        {
            var trimmed = textValue?.Trim() ?? string.Empty;
            return trimmed[..Math.Min(maxLength, trimmed.Length)];
        }

        return string.Empty;
    }

    private static int ClampReward(int value) => Math.Clamp(value, 0, 10_000);

    private static bool IsHexColor(string value) =>
        value.Length == 7 &&
        value[0] == '#' &&
        value.Skip(1).All(character => char.IsAsciiHexDigit(character));

    private static string NormalizeNumberPegDefinitionsValue(string rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            return "{\"pegs\":[]}";
        }

        try
        {
            JsonNode? root = JsonNode.Parse(rawValue);
            for (var i = 0; i < 3; i++)
            {
                if (root is not JsonValue valueNode || !valueNode.TryGetValue<string>(out var nestedJson))
                {
                    break;
                }

                if (string.IsNullOrWhiteSpace(nestedJson)) break;
                root = JsonNode.Parse(nestedJson);
            }

            var source = root switch
            {
                JsonArray direct => direct,
                JsonObject obj when obj["pegs"] is JsonArray pegs => pegs,
                JsonObject obj when obj["definitions"] is JsonArray definitions => definitions,
                _ => new JsonArray(),
            };

            var normalized = source
                .OfType<JsonObject>()
                .Select(item => new
                {
                    number = ToInt(item["number"]),
                    name = item["name"]?.GetValue<string>()?.Trim(),
                    icon = (item["icon"] ?? item["image"])?.GetValue<string>()?.Trim(),
                    description = item["description"]?.GetValue<string>()?.Trim(),
                    unlockLevel = ToInt(item["unlockLevel"]),
                })
                .Where(item => item.number is >= 1 and <= 100 &&
                               !string.IsNullOrWhiteSpace(item.name) &&
                               !string.IsNullOrWhiteSpace(item.icon) &&
                               !string.IsNullOrWhiteSpace(item.description))
                .GroupBy(item => item.number)
                .Select(group => group.First())
                .OrderBy(item => item.number)
                .ToList();

            var unlockLevels = new Dictionary<int, int>();
            var minimumUnlockLevel = 1;
            foreach (var item in normalized)
            {
                var requestedLevel = Math.Clamp(
                    item.unlockLevel > 0 ? item.unlockLevel : (item.number + 9) / 10,
                    1,
                    100);
                var effectiveLevel = item.number == 1
                    ? 1
                    : Math.Max(minimumUnlockLevel, requestedLevel);
                unlockLevels[item.number] = effectiveLevel;
                minimumUnlockLevel = effectiveLevel;
            }

            return JsonSerializer.Serialize(new
            {
                pegs = normalized.Select(item => new
                {
                    item.number,
                    name = item.name,
                    icon = item.icon,
                    description = item.description,
                    unlockLevel = unlockLevels[item.number],
                }),
            });
        }
        catch
        {
            return rawValue;
        }
    }
}
