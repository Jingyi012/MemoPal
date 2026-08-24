using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class ReferralMilestoneReward : AuditableBaseEntity
{
    public string ReferrerUserId { get; set; } = string.Empty;
    public string MilestoneKey { get; set; } = string.Empty;
    public int ReferralsRequired { get; set; }
    public int RewardXp { get; set; }
    public int RewardPremiumDays { get; set; }
    public DateTime AwardedAt { get; set; }
}
