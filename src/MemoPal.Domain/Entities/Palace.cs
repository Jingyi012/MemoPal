using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class Palace : AuditableBaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int LocationsCount { get; set; }
    public string Thumbnail { get; set; } = string.Empty;
    // Global admin lock switch. Per-user unlock/access state is tracked via UserPalace.
    public bool IsLocked { get; set; }
    public DateTime? UnlockedAt { get; set; }
    public int Level { get; set; } = 1;
    public bool IsPremium { get; set; }
    public bool IsCustom { get; set; }

    public ICollection<Location> Locations { get; set; } = new List<Location>();
}


