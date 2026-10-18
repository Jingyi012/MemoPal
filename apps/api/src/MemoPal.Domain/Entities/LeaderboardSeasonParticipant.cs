using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class LeaderboardSeasonParticipant : AuditableBaseEntity
{
    public string SeasonId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public DateTime JoinedAtUtc { get; set; }
    public DateTime? OptedOutAtUtc { get; set; }
    public int FinalScore { get; set; }
    public int? FinalRank { get; set; }
    public int ActiveDays { get; set; }
    public int RewardCredits { get; set; }
    public DateTime? RewardExpiresAtUtc { get; set; }
    public string RewardStatus { get; set; } = LeaderboardRewardStatuses.Open;
    public DateTime? RewardedAtUtc { get; set; }
    public DateTime? RewardLastAttemptAtUtc { get; set; }
    public int RewardAttempts { get; set; }
    public string? RewardFailureCode { get; set; }
}

public static class LeaderboardRewardStatuses
{
    public const string Open = "open";
    public const string Pending = "pending";
    public const string Awarded = "awarded";
    public const string Failed = "failed";
    public const string NotEligible = "not-eligible";
    public const string OutsideRewardRanks = "outside-reward-ranks";
    public const string NoReward = "no-reward";
}
