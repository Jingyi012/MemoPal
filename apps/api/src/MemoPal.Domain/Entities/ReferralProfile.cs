using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class ReferralProfile : AuditableBaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string ReferralCode { get; set; } = string.Empty;
}
