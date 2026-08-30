using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class MilestoneDefinition : AuditableBaseEntity
{
    public string Key { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ConditionType { get; set; } = string.Empty;
    public int ConditionValue { get; set; }

    public ICollection<UserMilestone> UserMilestones { get; set; } = new List<UserMilestone>();
}


