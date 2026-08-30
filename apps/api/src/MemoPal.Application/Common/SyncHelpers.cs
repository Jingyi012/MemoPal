using MemoPal.Domain.Common;

namespace MemoPal.Application.Common;

public static class SyncHelpers
{
    public static void ApplySoftDelete(AuditableBaseEntity entity, bool delete)
    {
        if (!delete)
        {
            return;
        }

        entity.IsDeleted = true;
        entity.DeletedAt ??= DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;
    }
}

