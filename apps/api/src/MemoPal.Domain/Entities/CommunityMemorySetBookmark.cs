using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

/// <summary>A private bookmark to a discoverable community memory set.</summary>
public sealed class CommunityMemorySetBookmark : UserOwnedEntity
{
    public string MemorySetId { get; set; } = string.Empty;
    public MemorySet? MemorySet { get; set; }
}
