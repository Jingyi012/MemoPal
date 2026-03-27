using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class UserAuthIdentity : AuditableBaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string ProviderUserId { get; set; } = string.Empty;
    public string? ProviderEmail { get; set; }
    public DateTime LastSignInAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}
