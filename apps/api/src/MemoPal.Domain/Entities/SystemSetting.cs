using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class SystemSetting : AuditableBaseEntity
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Description { get; set; }
}
