using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class TechniquePlan : AuditableBaseEntity
{
    public string MemorySetId { get; set; } = string.Empty;
    public string TechniqueKey { get; set; } = MemoryTechniqueKeys.NumberPeg;
    public int SchemaVersion { get; set; } = 1;

    public MemorySet? MemorySet { get; set; }
    public ICollection<PegBinding> PegBindings { get; set; } = new List<PegBinding>();
    public ICollection<PalaceBinding> PalaceBindings { get; set; } = new List<PalaceBinding>();
}
