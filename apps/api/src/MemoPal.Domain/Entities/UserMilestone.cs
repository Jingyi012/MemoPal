using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class UserMilestone : UserOwnedEntity
{
    public string MilestoneId { get; set; } = string.Empty;
    public DateTime? AchievedAt { get; set; }

    public MilestoneDefinition? Milestone { get; set; }
}

