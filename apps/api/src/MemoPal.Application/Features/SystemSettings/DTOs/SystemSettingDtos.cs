namespace MemoPal.Application.Features.SystemSettings.DTOs;

public sealed record SystemSettingDto(
    string Id,
    string Key,
    string Value,
    string? Description,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public sealed class UpsertSystemSettingRequest
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Description { get; set; }
}
