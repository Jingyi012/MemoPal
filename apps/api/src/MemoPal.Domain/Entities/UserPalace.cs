using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class UserPalace : UserOwnedSyncEntity
{
    public string PalaceId { get; set; } = string.Empty;
    public bool IsOwner { get; set; }
    public bool IsUnlocked { get; set; }
    public DateTime? UnlockedAt { get; set; }

    public Palace? Palace { get; set; }
}
