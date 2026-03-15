namespace MemoPal.Application.Features.Admin.DTOs;

public sealed record AdminModerationItemDto(
    string Id,
    string Type,
    string Title,
    string? Subtitle,
    bool IsLocked,
    bool IsDeleted,
    DateTime CreatedAt,
    string? CreatedBy
);

public sealed class AdminModerationUpdateRequest
{
    public bool? IsLocked { get; set; }
    public bool? IsDeleted { get; set; }
}
