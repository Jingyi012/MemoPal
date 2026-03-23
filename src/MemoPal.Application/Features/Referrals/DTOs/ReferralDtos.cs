namespace MemoPal.Application.Features.Referrals.DTOs;

public static class ReferralXpSourceTypes
{
    public const string InviterReward = "referral_inviter_reward";
    public const string InviteeReward = "referral_invitee_reward";
    public const string MilestoneReward = "referral_milestone_reward";
}

public sealed class ReferralMilestoneConfigDto
{
    public string Key { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public int ReferralsRequired { get; set; } = 1;
    public int RewardXp { get; set; }
    public int RewardPremiumDays { get; set; }
    public string? RewardLabel { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; } = 1;
}

public sealed class ReferralProgramConfigDto
{
    public bool IsEnabled { get; set; } = true;
    public int InviterRewardXp { get; set; } = 80;
    public int InviterRewardPremiumDays { get; set; } = 3;
    public int InviteeRewardXp { get; set; } = 40;
    public int InviteeRewardPremiumDays { get; set; } = 2;
    public int MaxSuccessfulReferralsPerUser { get; set; } = 100;
    public IReadOnlyList<ReferralMilestoneConfigDto> Milestones { get; set; } = [];
}

public sealed class UpsertReferralProgramConfigRequest
{
    public ReferralProgramConfigDto? Config { get; set; }
}

public sealed class RedeemReferralRequest
{
    public string Code { get; set; } = string.Empty;
}

public sealed record ReferralInviteeDto(
    string ReferralId,
    string RefereeUserId,
    string DisplayName,
    string Email,
    bool IsPremium,
    DateTime RedeemedAt,
    int InviterRewardXp,
    int InviterRewardPremiumDays
);

public sealed record ReferralMilestoneProgressDto(
    string Key,
    string Title,
    int ReferralsRequired,
    int CurrentReferrals,
    int RewardXp,
    int RewardPremiumDays,
    string? RewardLabel,
    int SortOrder,
    bool IsActive,
    bool IsReached,
    bool IsAwarded
);

public sealed record ReferralSummaryDto(
    string ReferralCode,
    int SuccessfulReferrals,
    int TotalXpEarned,
    int TotalPremiumDaysEarned,
    bool HasRedeemedCode,
    string? ReferredByUserId,
    string? ReferredByDisplayName,
    ReferralProgramConfigDto Config,
    IReadOnlyList<ReferralMilestoneProgressDto> Milestones,
    IReadOnlyList<ReferralInviteeDto> Referrals
);

public sealed record RedeemReferralResultDto(
    string ReferralId,
    string ReferrerUserId,
    string ReferrerDisplayName,
    int InviteeAwardedXp,
    int InviteeAwardedPremiumDays,
    int InviterAwardedXp,
    int InviterAwardedPremiumDays,
    IReadOnlyList<ReferralMilestoneProgressDto> NewlyAwardedMilestones
);

public sealed record AdminReferralUserDto(
    string UserId,
    string DisplayName,
    string Email,
    string ReferralCode,
    int SuccessfulReferrals,
    int TotalXpAwarded,
    int TotalPremiumDaysAwarded,
    DateTime? LastReferralAt,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public sealed record AdminReferralRecordDto(
    string Id,
    string ReferralCode,
    string ReferrerUserId,
    string ReferrerDisplayName,
    string ReferrerEmail,
    string RefereeUserId,
    string RefereeDisplayName,
    string RefereeEmail,
    DateTime RedeemedAt,
    int InviterRewardXp,
    int InviterRewardPremiumDays,
    int InviteeRewardXp,
    int InviteeRewardPremiumDays
);
