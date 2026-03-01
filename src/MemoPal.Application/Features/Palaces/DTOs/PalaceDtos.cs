namespace MemoPal.Application.Features.Palaces.DTOs;

public sealed record PalaceDto(
    string Id,
    string Name,
    string Description,
    int LocationsCount,
    string Thumbnail,
    bool IsLocked,
    DateTime? UnlockedAt,
    int RequiredXp,
    bool IsPremium,
    bool IsCustom,
    string? CreatedBy,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? LastSyncedAt,
    bool IsDeleted,
    DateTime? DeletedAt
);

public sealed class PalaceUpsertRequest
{
    public string? Id { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
    public int LocationsCount { get; set; }
    public string? Thumbnail { get; set; }
    public bool IsLocked { get; set; }
    public DateTime? UnlockedAt { get; set; }
    public int RequiredXp { get; set; }
    public bool IsPremium { get; set; }
    public bool IsCustom { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? LastSyncedAt { get; set; }
    public bool? IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}

