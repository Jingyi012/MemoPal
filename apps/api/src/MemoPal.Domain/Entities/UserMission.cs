using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class UserMission : UserOwnedEntity
{
    public string MissionKey { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public string PeriodToken { get; set; } = string.Empty;
    public int TargetValue { get; set; }
    public int CurrentValue { get; set; }
    public int RewardXp { get; set; }
    public DateTime CompletedAt { get; set; }
    public DateTime? RewardClaimedAt { get; set; }
}

