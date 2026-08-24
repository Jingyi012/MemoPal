namespace MemoPal.Application.Features.Users.DTOs;

public sealed record ManagedUserLocationDataDto(
    string Id,
    string PalaceId,
    int Position,
    string Name,
    string Description,
    string ImageUrl,
    bool IsDeleted,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public sealed record ManagedUserPalaceDataDto(
    string Id,
    string Name,
    string Description,
    int Level,
    bool IsPremium,
    bool IsCustom,
    bool IsOwner,
    bool IsUnlocked,
    DateTime? UnlockedAt,
    bool IsDeleted,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IReadOnlyList<ManagedUserLocationDataDto> Locations,
    int UserLessonCount = 0
);

public sealed record ManagedUserPalaceListItemDto(
    string Id,
    string Name,
    string Description,
    int Level,
    bool IsPremium,
    bool IsCustom,
    bool IsOwner,
    bool IsUnlocked,
    DateTime? UnlockedAt,
    bool IsDeleted,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    int LocationsCount,
    int UserLessonCount
);

public sealed record ManagedUserWordDataDto(
    string Id,
    string LessonId,
    string LocationId,
    string Text,
    string? Meaning,
    bool IsDeleted,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public sealed record ManagedUserLessonDataDto(
    string Id,
    string PalaceId,
    string Title,
    string? Description,
    int WordCount,
    string? Category,
    string[]? Tag,
    bool? IsCustom,
    bool? IsLocked,
    bool? Completed,
    bool? IsPremium,
    string Privacy,
    string? CreatedBy,
    bool IsDeleted,
    DateTime? DeletedAt,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IReadOnlyList<ManagedUserWordDataDto> Words
);

public sealed record ManagedUserReviewScheduleDataDto(
    string Id,
    string LessonProgressId,
    int ReviewRound,
    DateTime DueDate,
    bool Completed,
    DateTime? CompletedDate,
    bool IsDeleted,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public sealed record ManagedUserLessonProgressDataDto(
    string Id,
    string LessonId,
    string LessonTitle,
    string PalaceId,
    string PalaceName,
    bool PalaceIsCustom,
    bool LessonIsCustom,
    DateTime? FirstCompletedDate,
    int TotalReviews,
    string MasteryLevel,
    DateTime? LastReviewDate,
    int XpEarned,
    bool IsDeleted,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IReadOnlyList<ManagedUserReviewScheduleDataDto> ReviewSchedules
);

public sealed record ManagedUserBadgeDataDto(
    string UserBadgeId,
    string BadgeId,
    string Key,
    string Name,
    string? Description,
    string? Rarity,
    DateTime? EarnedAt,
    bool IsDeleted,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public sealed record ManagedUserMilestoneDataDto(
    string UserMilestoneId,
    string MilestoneId,
    string Key,
    string Title,
    string? Description,
    string ConditionType,
    int ConditionValue,
    DateTime? AchievedAt,
    bool IsDeleted,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public sealed record ManagedUserXpEventDataDto(
    string Id,
    string SourceType,
    string? SourceId,
    int XpAmount,
    string ClientEventId,
    bool IsDeleted,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public sealed record ManagedUserNotificationDataDto(
    string Id,
    string Type,
    string Title,
    string Body,
    string? ReferenceType,
    string? ReferenceId,
    bool IsRead,
    bool IsDismissed,
    DateTime? ReadAt,
    bool IsDeleted,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public sealed record ManagedUserSubscriptionDataDto(
    string Id,
    string PlanId,
    string Provider,
    string? ProviderReference,
    string Status,
    DateTime StartedAt,
    DateTime? ExpiresAt,
    bool AutoRenew,
    DateTime? LastVerifiedAt,
    bool IsDeleted,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public sealed record ManagedUserDataCountsDto(
    int PalaceCount,
    int LessonCount,
    int WordCount,
    int ProgressCount,
    int ReviewScheduleCount,
    int XpEventCount,
    int BadgeCount,
    int MilestoneCount,
    int NotificationCount,
    int SubscriptionCount
);

public sealed record ManagedUserDataOverviewDto(
    ManagedUserDto User,
    UserStatsDto? Stats,
    ManagedUserDataCountsDto Counts
);

public sealed record ManagedUserDataDto(
    ManagedUserDto User,
    UserStatsDto? Stats,
    IReadOnlyList<ManagedUserPalaceDataDto> Palaces,
    IReadOnlyList<ManagedUserLessonDataDto> Lessons,
    IReadOnlyList<ManagedUserLessonProgressDataDto> Progresses,
    IReadOnlyList<ManagedUserBadgeDataDto> Badges,
    IReadOnlyList<ManagedUserMilestoneDataDto> Milestones,
    IReadOnlyList<ManagedUserXpEventDataDto> XpEvents,
    IReadOnlyList<ManagedUserNotificationDataDto> Notifications,
    IReadOnlyList<ManagedUserSubscriptionDataDto> Subscriptions
);
