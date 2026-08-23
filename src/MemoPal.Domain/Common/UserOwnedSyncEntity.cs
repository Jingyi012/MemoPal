namespace MemoPal.Domain.Common;

/// <summary>
/// Legacy alias retained while the mobile SQLite synchronization layer is removed.
/// New entities should inherit <see cref="UserOwnedEntity"/> directly.
/// </summary>
public abstract class UserOwnedSyncEntity : UserOwnedEntity
{
}

