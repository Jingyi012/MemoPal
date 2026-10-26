using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

/// <summary>Education-side provenance for a learner-owned MemorySet.</summary>
public sealed class EducationObjectiveDerivedMemorySet : AuditableBaseEntity
{
    public string ObjectiveId { get; set; } = string.Empty;
    public string MemorySetId { get; set; } = string.Empty;
    public string OwnerUserId { get; set; } = string.Empty;
    public string TechniqueKey { get; set; } = string.Empty;
    public string SourceContentHash { get; set; } = string.Empty;
    public int SourceItemCount { get; set; }
    public DateTime DerivedAtUtc { get; set; }
    public DateTime LastSyncedAtUtc { get; set; }

    public ICollection<EducationDerivedItemMap> Items { get; set; } = new List<EducationDerivedItemMap>();
}

public sealed class EducationDerivedItemMap : AuditableBaseEntity
{
    public string DerivedId { get; set; } = string.Empty;
    public string StudyItemId { get; set; } = string.Empty;
    public string MemoryItemId { get; set; } = string.Empty;
    public string LastSyncedContentHash { get; set; } = string.Empty;
}
