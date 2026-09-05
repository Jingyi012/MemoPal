using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class MemorySetReport : UserOwnedEntity
{
    public string MemorySetId { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string? Details { get; set; }

    public MemorySet? MemorySet { get; set; }
}
