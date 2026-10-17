using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class User : AuditableBaseEntity
{
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = UserRoles.User;
    public string? AvatarUrl { get; set; }
    public string? SelectedAvatarId { get; set; }
    public int TotalXp { get; set; }
    public int Level { get; set; } = 1;
    public bool IsPremium { get; set; }
    public string? ReferredByUserId { get; set; }
    public int OnboardingVersion { get; set; } = 1;
    public string OnboardingStatus { get; set; } = OnboardingStatuses.NotStarted;
    public string OnboardingStep { get; set; } = OnboardingSteps.ChooseCategory;
    public string? OnboardingSelectedCategoryId { get; set; }
    public string? OnboardingSelectedLessonId { get; set; }
    public string? OnboardingMemorySetId { get; set; }
    public DateTime? OnboardingCompletedAt { get; set; }
    public DateTime? OnboardingSkippedAt { get; set; }

    public UserStats? Stats { get; set; }
    public ICollection<UserAuthIdentity> AuthIdentities { get; set; } = [];
    public ICollection<RefreshTokenSession> RefreshTokenSessions { get; set; } = [];
}

public static class OnboardingStatuses
{
    public const string NotStarted = "not-started";
    public const string InProgress = "in-progress";
    public const string Completed = "completed";
    public const string Skipped = "skipped";
}

public static class OnboardingSteps
{
    public const string ChooseCategory = "choose-category";
    public const string BuildMemory = "build-memory";
    public const string PracticeMemory = "practice-memory";
    public const string Finished = "finished";
}
