using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class BadgeDefinition : AuditableBaseEntity
{
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public string? IconUrl { get; set; }
    public string? Rarity { get; set; }
    public string ConditionType { get; set; } = "manual";
    public int ConditionValue { get; set; }

    public ICollection<UserBadge> UserBadges { get; set; } = new List<UserBadge>();
}


