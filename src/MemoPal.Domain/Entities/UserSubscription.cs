using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class UserSubscription : AuditableBaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string PlanId { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string? ProviderReference { get; set; }
    public string Status { get; set; } = "active";
    public DateTime StartedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool AutoRenew { get; set; }
    public DateTime? LastVerifiedAt { get; set; }
}
