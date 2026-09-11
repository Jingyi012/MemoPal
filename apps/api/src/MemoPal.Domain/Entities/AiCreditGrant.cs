using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class AiCreditGrant : AuditableBaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public string Source { get; set; } = "manual";
    public int Amount { get; set; }
    public int Remaining { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
