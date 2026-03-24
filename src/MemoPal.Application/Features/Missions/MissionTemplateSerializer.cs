using System.Globalization;
using System.Text;
using System.Text.Json;
using MemoPal.Application.Features.Missions.DTOs;

namespace MemoPal.Application.Features.Missions;

public static class MissionTemplateSerializer
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public static IReadOnlyList<MissionTemplateDto> ParseOrDefault(string? rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            return GetDefaultTemplates();
        }

        try
        {
            var config = JsonSerializer.Deserialize<MissionTemplatesConfigDto>(rawValue, JsonOptions);

            return Normalize(config?.Templates ?? []);
        }
        catch (JsonException)
        {
            return GetDefaultTemplates();
        }
    }

    public static IReadOnlyList<MissionTemplateDto> Normalize(IEnumerable<MissionTemplateDto> templates)
    {
        var normalized = new List<MissionTemplateDto>();
        var seenKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var sortOrder = 1;

        foreach (var template in templates)
        {
            if (template is null) continue;

            var title = template.Title?.Trim();
            if (string.IsNullOrWhiteSpace(title)) continue;

            var metricType = NormalizeMetricType(template.MetricType);
            var period = NormalizePeriod(template.Period);
            var target = Math.Max(1, template.TargetValue);
            var rewardXp = Math.Max(0, template.RewardXp);

            var key = string.IsNullOrWhiteSpace(template.Key)
                ? Slugify(title)
                : Slugify(template.Key);

            if (string.IsNullOrWhiteSpace(key) || !seenKeys.Add(key))
            {
                continue;
            }

            normalized.Add(new MissionTemplateDto
            {
                Key = key,
                Title = title,
                Description = string.IsNullOrWhiteSpace(template.Description) ? null : template.Description.Trim(),
                MetricType = metricType,
                Period = period,
                TargetValue = target,
                RewardXp = rewardXp,
                SortOrder = template.SortOrder > 0 ? template.SortOrder : sortOrder,
                IsActive = template.IsActive
            });

            sortOrder++;
        }

        if (normalized.Count == 0)
        {
            return GetDefaultTemplates();
        }

        return normalized
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Title, StringComparer.OrdinalIgnoreCase)
            .Select((x, index) =>
            {
                x.SortOrder = index + 1;
                return x;
            })
            .ToList();
    }

    public static string Serialize(IReadOnlyList<MissionTemplateDto> templates)
    {
        return JsonSerializer.Serialize(templates, JsonOptions);
    }

    public static IReadOnlyList<MissionTemplateDto> GetDefaultTemplates()
    {
        return new List<MissionTemplateDto>
        {
            new()
            {
                Key = "daily_review_rhythm",
                Title = "Daily Review Rhythm",
                Description = "Complete 3 reviews today to keep memory traces fresh.",
                MetricType = MissionMetricTypes.ReviewsCompleted,
                Period = MissionPeriods.Daily,
                TargetValue = 3,
                RewardXp = 25,
                SortOrder = 1,
                IsActive = true
            },
            new()
            {
                Key = "weekly_lesson_finish",
                Title = "Weekly Lesson Finisher",
                Description = "Finish 2 lessons this week to maintain momentum.",
                MetricType = MissionMetricTypes.LessonsCompleted,
                Period = MissionPeriods.Weekly,
                TargetValue = 2,
                RewardXp = 50,
                SortOrder = 2,
                IsActive = true
            },
            new()
            {
                Key = "weekly_xp_build",
                Title = "Weekly XP Build",
                Description = "Earn 120 XP this week through learning and reviews.",
                MetricType = MissionMetricTypes.XpEarned,
                Period = MissionPeriods.Weekly,
                TargetValue = 120,
                RewardXp = 40,
                SortOrder = 3,
                IsActive = true
            },
            new()
            {
                Key = "streak_guard",
                Title = "Streak Guard",
                Description = "Keep at least a 5-day streak to reinforce consistency.",
                MetricType = MissionMetricTypes.StreakDays,
                Period = MissionPeriods.AllTime,
                TargetValue = 5,
                RewardXp = 35,
                SortOrder = 4,
                IsActive = true
            },
            new()
            {
                Key = "mastery_drive",
                Title = "Mastery Drive",
                Description = "Master 3 lessons in total to strengthen long-term retention.",
                MetricType = MissionMetricTypes.MasteredLessons,
                Period = MissionPeriods.AllTime,
                TargetValue = 3,
                RewardXp = 80,
                SortOrder = 5,
                IsActive = true
            },
            new()
            {
                Key = "weekly_word_builder",
                Title = "Weekly Word Builder",
                Description = "Learn 25 words this week to expand your palace vocabulary.",
                MetricType = MissionMetricTypes.WordsLearned,
                Period = MissionPeriods.Weekly,
                TargetValue = 25,
                RewardXp = 45,
                SortOrder = 6,
                IsActive = true
            },
            new()
            {
                Key = "daily_quick_wins",
                Title = "Daily Quick Wins",
                Description = "Complete 1 lesson today for consistent learning cadence.",
                MetricType = MissionMetricTypes.LessonsCompleted,
                Period = MissionPeriods.Daily,
                TargetValue = 1,
                RewardXp = 20,
                SortOrder = 7,
                IsActive = true
            }
        };
    }

    private static string NormalizeMetricType(string? metricType)
    {
        var value = metricType?.Trim().ToLowerInvariant();
        return value switch
        {
            MissionMetricTypes.ReviewsCompleted => MissionMetricTypes.ReviewsCompleted,
            MissionMetricTypes.LessonsCompleted => MissionMetricTypes.LessonsCompleted,
            MissionMetricTypes.XpEarned => MissionMetricTypes.XpEarned,
            MissionMetricTypes.StreakDays => MissionMetricTypes.StreakDays,
            MissionMetricTypes.MasteredLessons => MissionMetricTypes.MasteredLessons,
            MissionMetricTypes.WordsLearned => MissionMetricTypes.WordsLearned,
            _ => MissionMetricTypes.ReviewsCompleted
        };
    }

    private static string NormalizePeriod(string? period)
    {
        var value = period?.Trim().ToLowerInvariant();
        return value switch
        {
            MissionPeriods.Daily => MissionPeriods.Daily,
            MissionPeriods.Weekly => MissionPeriods.Weekly,
            MissionPeriods.AllTime => MissionPeriods.AllTime,
            _ => MissionPeriods.Daily
        };
    }

    private static string Slugify(string input)
    {
        var text = input.Trim().ToLowerInvariant();
        var buffer = new StringBuilder(text.Length);

        foreach (var ch in text.Normalize(NormalizationForm.FormD))
        {
            if (CharUnicodeInfo.GetUnicodeCategory(ch) == UnicodeCategory.NonSpacingMark)
            {
                continue;
            }

            if (char.IsLetterOrDigit(ch))
            {
                buffer.Append(ch);
                continue;
            }

            if (buffer.Length > 0 && buffer[^1] != '_')
            {
                buffer.Append('_');
            }
        }

        return buffer.ToString().Trim('_');
    }
}
