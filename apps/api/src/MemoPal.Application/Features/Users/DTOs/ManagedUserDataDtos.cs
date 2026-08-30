namespace MemoPal.Application.Features.Users.DTOs;

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
