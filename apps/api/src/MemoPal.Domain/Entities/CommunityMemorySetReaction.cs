using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

/// <summary>A private-to-user helpful reaction; only aggregate counts are public.</summary>
public sealed class CommunityMemorySetReaction : UserOwnedEntity
{
    public string MemorySetId { get; set; } = string.Empty;

    public MemorySet? MemorySet { get; set; }
}
