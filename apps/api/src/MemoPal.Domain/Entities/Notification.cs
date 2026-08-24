using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class Notification : UserOwnedEntity
{
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? ReferenceType { get; set; }
    public string? ReferenceId { get; set; }
    public bool IsRead { get; set; }
    public bool IsDismissed { get; set; }
    public DateTime? ReadAt { get; set; }
}

