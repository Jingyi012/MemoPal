namespace MemoPal.Application.Features.Notifications.DTOs;

public sealed record NotificationDto(
    string Id,
    string Type,
    string Title,
    string Body,
    string? ReferenceType,
    string? ReferenceId,
    bool IsRead,
    bool IsDismissed,
    DateTime? ReadAt,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    bool IsDeleted,
    DateTime? DeletedAt
);

public sealed class NotificationUpsertRequest
{
    public string? Id { get; set; }
    public string? Type { get; set; }
    public string? Title { get; set; }
    public string? Body { get; set; }
    public string? ReferenceType { get; set; }
    public string? ReferenceId { get; set; }
    public bool IsRead { get; set; }
    public bool IsDismissed { get; set; }
    public DateTime? ReadAt { get; set; }
    public string? Scope { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool? IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}

