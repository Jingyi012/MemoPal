using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

/// <summary>
/// Mission template configuration
/// Defines mission objectives, rewards, metrics, and conditions
/// </summary>
public sealed class MissionTemplate : AuditableBaseEntity
{
    /// <summary>
    /// Unique key (e.g., "daily_reviews", "weekly_lessons_completed")
    /// </summary>
    public string Key { get; set; } = string.Empty;

    /// <summary>
    /// Human-readable title
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Optional description
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// The metric this mission tracks (e.g., "ReviewsCompleted", "LessonsCompleted")
    /// </summary>
    public string MetricType { get; set; } = string.Empty;

    /// <summary>
    /// Mission period ("Daily", "Weekly", "AllTime")
    /// </summary>
    public string Period { get; set; } = "Daily";

    /// <summary>
    /// Target value to achieve mission
    /// </summary>
    public int TargetValue { get; set; }

    /// <summary>
    /// XP reward for completing mission
    /// </summary>
    public int RewardXp { get; set; }

    /// <summary>
    /// Display order in UI
    /// </summary>
    public int SortOrder { get; set; }

    /// <summary>
    /// Whether this mission is currently active
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Optional conditions (stored as JSON for flexibility)
    /// e.g., { "minStreak": 5, "minLevel": 10 }
    /// </summary>
    public string? Conditions { get; set; }

    /// <summary>
    /// Version for tracking changes (for cache invalidation)
    /// </summary>
    public int Version { get; set; } = 1;
}
