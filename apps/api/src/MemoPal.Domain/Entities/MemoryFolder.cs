using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

/// <summary>
/// A single-level, user-owned grouping for memory sets.
/// </summary>
public sealed class MemoryFolder : UserOwnedEntity
{
    public string Name { get; set; } = string.Empty;

    public ICollection<MemorySet> MemorySets { get; set; } = new List<MemorySet>();
}
