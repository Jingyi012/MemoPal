using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class Location : AuditableBaseEntity
{
    public string PalaceId { get; set; } = string.Empty;
    public int Position { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;

    public Palace? Palace { get; set; }
}


