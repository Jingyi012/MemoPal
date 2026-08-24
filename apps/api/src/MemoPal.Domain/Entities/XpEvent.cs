using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class XpEvent : UserOwnedEntity
{
    public string SourceType { get; set; } = string.Empty;
    public string? SourceId { get; set; }
    public int XpAmount { get; set; }
    public string ClientEventId { get; set; } = string.Empty;
}
