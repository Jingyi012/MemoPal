namespace MemoPal.Application.Features.Locations.DTOs;

public sealed record LocationDto(
    string Id,
    string PalaceId,
    int Position,
    string Name,
    string Description,
    string ImageUrl,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? LastSyncedAt,
    bool IsDeleted,
    DateTime? DeletedAt
);

public sealed class LocationUpsertRequest
{
    public string? Id { get; set; }
    public string? PalaceId { get; set; }
    public int Position { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? LastSyncedAt { get; set; }
    public bool? IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}

