namespace MemoPal.Domain.Common;

/// <summary>
/// Base type for audited entities that belong to a user.
/// </summary>
public abstract class UserOwnedEntity : AuditableBaseEntity
{
    public string UserId { get; set; } = string.Empty;
}
