namespace MemoPal.Domain.Common;

public abstract class UserOwnedSyncEntity : AuditableBaseEntity
{
    public string UserId { get; set; } = string.Empty;
}

