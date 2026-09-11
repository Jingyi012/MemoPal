using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class AiCreditEntry : AuditableBaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public string Kind { get; set; } = string.Empty;
    public int Amount { get; set; }
}
