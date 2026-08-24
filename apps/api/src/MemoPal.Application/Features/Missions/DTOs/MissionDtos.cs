using System.Text.Json.Serialization;

namespace MemoPal.Application.Features.Missions.DTOs;

public static class MissionMetricTypes
{
    public const string ReviewsCompleted = "reviews_completed";
    public const string LessonsCompleted = "lessons_completed";
    public const string XpEarned = "xp_earned";
    public const string StreakDays = "streak_days";
    public const string MasteredLessons = "mastered_lessons";
    public const string WordsLearned = "words_learned";
}

public static class MissionPeriods
{
    public const string Daily = "daily";
    public const string Weekly = "weekly";
    public const string AllTime = "all_time";
}

public sealed class MissionTemplateDto
{
    public string Key { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string MetricType { get; set; } = MissionMetricTypes.ReviewsCompleted;
    public string Period { get; set; } = MissionPeriods.Daily;
    public int TargetValue { get; set; } = 1;
    public int RewardXp { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class UpsertMissionTemplatesRequest
{
    public IReadOnlyList<MissionTemplateDto> Templates { get; set; } = [];
}

public class MissionTemplatesConfigDto
{
    [JsonPropertyName("templates")]
    public List<MissionTemplateDto> Templates { get; set; } = new();
}

public sealed record MissionProgressDto(
    string Key,
    string Title,
    string? Description,
    string MetricType,
    string Period,
    int CurrentValue,
    int TargetValue,
    int RewardXp,
    int SortOrder,
    bool IsActive,
    bool IsCompleted,
    int ProgressPercent,
    bool IsClaimed
);

public sealed record UserMissionDashboardDto(
    DateTime GeneratedAtUtc,
    IReadOnlyList<MissionProgressDto> Missions
);
