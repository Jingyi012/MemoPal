using System.Text.Json;
using MemoPal.Application.Features.Missions.DTOs;

namespace MemoPal.Application.Features.Missions;

public static class GamificationMobileUiConfigSerializer
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public static GamificationMobileUiConfigDto ParseOrDefault(string? rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            return GetDefault();
        }

        try
        {
            var parsed = JsonSerializer.Deserialize<GamificationMobileUiConfigDto>(rawValue, JsonOptions);
            return Normalize(parsed);
        }
        catch (JsonException)
        {
            return GetDefault();
        }
    }

    public static string Serialize(GamificationMobileUiConfigDto config)
    {
        return JsonSerializer.Serialize(Normalize(config), JsonOptions);
    }

    public static GamificationMobileUiConfigDto GetDefault()
    {
        return new GamificationMobileUiConfigDto
        {
            HomeMissionCardTitle = "Mission Board",
            HomeMissionCardDescription = "Track your current missions and claim rewards.",
            MissionScreenTitle = "Mission Board",
            MissionScreenDescription = "Complete missions to earn XP and stay consistent.",
            MissionSectionTitle = "Active Missions",
            MissionSectionDescription = "Complete each mission and claim your XP reward.",
            BadgeSectionTitle = "Badges",
            MilestoneSectionTitle = "Milestone Journey",
            HomeMissionPreviewCount = 2,
            MilestoneTypeLabels = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                [MissionMetricTypes.ReviewsCompleted] = "Review Milestones",
                [MissionMetricTypes.LessonsCompleted] = "Lesson Milestones",
                [MissionMetricTypes.WordsLearned] = "Word Milestones",
                [MissionMetricTypes.XpEarned] = "XP Milestones",
                [MissionMetricTypes.StreakDays] = "Streak Milestones",
                [MissionMetricTypes.MasteredLessons] = "Mastery Milestones",
                ["level"] = "Level Milestones"
            }
        };
    }

    private static GamificationMobileUiConfigDto Normalize(GamificationMobileUiConfigDto? config)
    {
        var defaults = GetDefault();
        if (config is null)
        {
            return defaults;
        }

        var labels = new Dictionary<string, string>(defaults.MilestoneTypeLabels, StringComparer.OrdinalIgnoreCase);
        if (config.MilestoneTypeLabels is not null)
        {
            foreach (var item in config.MilestoneTypeLabels)
            {
                var key = item.Key?.Trim();
                var value = item.Value?.Trim();
                if (string.IsNullOrWhiteSpace(key) || string.IsNullOrWhiteSpace(value))
                {
                    continue;
                }

                labels[key] = value;
            }
        }

        return new GamificationMobileUiConfigDto
        {
            HomeMissionCardTitle = NormalizeText(config.HomeMissionCardTitle, defaults.HomeMissionCardTitle),
            HomeMissionCardDescription = NormalizeText(config.HomeMissionCardDescription, defaults.HomeMissionCardDescription),
            MissionScreenTitle = NormalizeText(config.MissionScreenTitle, defaults.MissionScreenTitle),
            MissionScreenDescription = NormalizeText(config.MissionScreenDescription, defaults.MissionScreenDescription),
            MissionSectionTitle = NormalizeText(config.MissionSectionTitle, defaults.MissionSectionTitle),
            MissionSectionDescription = NormalizeText(config.MissionSectionDescription, defaults.MissionSectionDescription),
            BadgeSectionTitle = NormalizeText(config.BadgeSectionTitle, defaults.BadgeSectionTitle),
            MilestoneSectionTitle = NormalizeText(config.MilestoneSectionTitle, defaults.MilestoneSectionTitle),
            HomeMissionPreviewCount = Math.Clamp(config.HomeMissionPreviewCount, 0, 6),
            MilestoneTypeLabels = labels
        };
    }

    private static string NormalizeText(string? value, string fallback)
    {
        return string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
    }
}
