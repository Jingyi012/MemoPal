using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class XpConfig : AuditableBaseEntity
{
    public string SourceType { get; set; } = string.Empty;
    public int BaseXp { get; set; }
    public int VariableXp { get; set; }
    public bool IsActive { get; set; } = true;
}


