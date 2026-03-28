namespace MemoPal.Application.Features.Community.DTOs;

public sealed record CommunityCreatorDto(
    string Id,
    string Name,
    bool IsVerified,
    string? AvatarUrl
);

public sealed record CommunityLessonStatsDto(
    int UsageCount,
    double Rating,
    int ReviewCount,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public sealed record CommunityWordDto(
    string Word,
    string? Meaning
);

public sealed record CommunityLessonDto(
    string Id,
    string Title,
    string Description,
    IReadOnlyList<CommunityWordDto> Words,
    string Category,
    string[] Tags,
    CommunityCreatorDto Creator,
    CommunityLessonStatsDto Stats,
    string ShareCode,
    bool IsPublic,
    bool IsPremium
);

