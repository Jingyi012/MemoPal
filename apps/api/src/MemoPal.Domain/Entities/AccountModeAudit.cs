using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

/// <summary>Administrative mode/explicit privacy changes; contains no learner content.</summary>
public sealed class AccountModeAudit : AuditableBaseEntity
{
    public string OperatorUserId { get; set; } = string.Empty;
    public string SubjectUserId { get; set; } = string.Empty;
    public AccountMode PreviousMode { get; set; }
    public AccountMode NewMode { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? ResourceId { get; set; }
    public string Reason { get; set; } = string.Empty;
}
