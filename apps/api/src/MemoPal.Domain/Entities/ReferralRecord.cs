using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class ReferralRecord : AuditableBaseEntity
{
    public string ReferrerUserId { get; set; } = string.Empty;
    public string RefereeUserId { get; set; } = string.Empty;
    public string ReferralCode { get; set; } = string.Empty;
    public DateTime RedeemedAt { get; set; }
    public int InviterRewardXp { get; set; }
    public int InviterRewardPremiumDays { get; set; }
    public int InviteeRewardXp { get; set; }
    public int InviteeRewardPremiumDays { get; set; }
}
