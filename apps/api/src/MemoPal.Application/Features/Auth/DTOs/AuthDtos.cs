using MemoPal.Application.Features.Users.DTOs;

namespace MemoPal.Application.Features.Auth.DTOs;

public sealed record AuthResponseDto(
    string Token,
    DateTime TokenExpiresAtUtc,
    string RefreshToken,
    DateTime RefreshTokenExpiresAtUtc,
    UserWithStatDto User);

public sealed record LoginMethodsDto(
    bool EmailPassword,
    bool Google,
    bool Facebook);

public sealed record UserWithStatDto(
    string Id,
    string DisplayName,
    string? AvatarUrl,
    string Email,
    int TotalXp,
    int Level,
    bool IsPremium,
    int OnboardingVersion,
    string OnboardingStatus,
    string OnboardingStep,
    string? OnboardingSelectedCategoryId,
    string? OnboardingSelectedLessonId,
    string? OnboardingMemorySetId,
    DateTime? OnboardingCompletedAt,
    DateTime? OnboardingSkippedAt,
    UserStatsDto? Stats,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    bool IsDeleted,
    DateTime? DeletedAt
);


