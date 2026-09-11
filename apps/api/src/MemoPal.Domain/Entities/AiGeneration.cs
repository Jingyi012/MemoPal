using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class AiGeneration : AuditableBaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string RequestId { get; set; } = string.Empty;
    public string RequestHash { get; set; } = string.Empty;
    public string Kind { get; set; } = string.Empty;
    public string Status { get; set; } = "reserved";
    public int UnitCost { get; set; }
    public int Reserved { get; set; }
    public int Charged { get; set; }
    public DateTime LeaseExpiresAt { get; set; }
    public string AllocationsJson { get; set; } = "[]";
    public string? InputJson { get; set; }
    public string? ResultJson { get; set; }
    public byte[]? ImageBytes { get; set; }
    public string? ImageContentType { get; set; }
}
