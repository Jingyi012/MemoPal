namespace MemoPal.Application.Features.Leaderboards.DTOs;

public sealed record LeaderboardPreferenceDto(bool OptedIn, DateTime? JoinedAtUtc);

public sealed record CommunityLeaderboardEntryDto(int Rank, string Alias, int Score, bool IsCurrentUser);

public sealed record LeaderboardTaskProgressDto(
    string Id,
    int SortOrder,
    string Metric,
    int Threshold,
    int Points,
    string TitleEn,
    string TitleZh,
    int CurrentValue,
    bool IsCompleted);

public sealed record CurrentCommunityLeaderboardDto(
    bool OptedIn,
    DateTime WeekStartsAtUtc,
    DateTime WeekEndsAtUtc,
    int EligibleParticipants,
    int PersonalGoalScore,
    int? MyScore,
    int? MyRank,
    IReadOnlyList<CommunityLeaderboardEntryDto> Entries,
    LeaderboardBoardDefinitionDto Board,
    IReadOnlyList<LeaderboardTaskProgressDto> TodayTasks,
    int MyActiveDays,
    int? MyProjectedRewardCredits,
    LeaderboardRewardResultDto? LatestReward);

public sealed record LeaderboardRewardResultDto(
    DateTime WeekStartsAtUtc,
    DateTime WeekEndsAtUtc,
    int? FinalRank,
    int FinalScore,
    int ActiveDays,
    int Credits,
    string Status,
    DateTime? ExpiresAtUtc,
    string SeasonStatus,
    bool RewardsEnabled,
    int MinimumActiveDays,
    string? QualificationReason);

public sealed record UpdateLeaderboardPreferenceRequest(bool OptedIn);
