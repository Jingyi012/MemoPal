namespace MemoPal.Application.Features.Users.DTOs;

public sealed record UserStatsDto(
    int LessonsCompleted,
    int WordsLearned,
    int CurrentStreak,
    int LongestStreak,
    DateTime? LastActiveDate,
    DateTime UpdatedAt
);

public sealed class UpdateUserStatsRequest
{
    public int? LessonsCompleted { get; set; }
    public int? WordsLearned { get; set; }
    public int? CurrentStreak { get; set; }
    public int? LongestStreak { get; set; }
    public DateTime? LastActiveDate { get; set; }
}

public sealed record UserLevelDto(int Level, int Xp);

public sealed record FeatureLimitsDto(
    bool IsPremium,
    int CustomPalaces,
    int CustomLessonsPerPalace,
    int CustomLocationsPerPalace,
    int CustomWordsPerLesson
);

public sealed record ManagedUserDto(
    string Id,
    string DisplayName,
    string Email,
    string Role,
    string? AvatarUrl,
    int TotalXp,
    int Level,
    bool IsPremium,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    bool IsDeleted,
    DateTime? DeletedAt,
    string? CreatedBy,
    string? UpdatedBy
);

public sealed class ManagedUserUpsertRequest
{
    public string? DisplayName { get; set; }
    public string? Email { get; set; }
    public string? Password { get; set; }
    public string? AvatarUrl { get; set; }
    public string? Role { get; set; }
    public int? TotalXp { get; set; }
    public int? Level { get; set; }
    public bool? IsPremium { get; set; }
    public bool? IsDeleted { get; set; }
}
