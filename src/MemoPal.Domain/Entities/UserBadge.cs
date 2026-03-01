using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class UserBadge : UserOwnedSyncEntity
{
    public string BadgeId { get; set; } = string.Empty;
    public DateTime? EarnedAt { get; set; }

    public BadgeDefinition? Badge { get; set; }
}

