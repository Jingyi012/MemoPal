namespace MemoPal.Application.Features.Configs.DTOs;

public sealed record LevelConfigDto(
    int Level,
    int RequiredXp,
    string? Title,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? LastSyncedAt,
    bool IsDeleted,
    DateTime? DeletedAt
);

public sealed record XpConfigDto(
    string Id,
    string SourceType,
    int BaseXp,
    int VariableXp,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? LastSyncedAt,
    bool IsDeleted,
    DateTime? DeletedAt
);

public sealed class LevelConfigUpsertRequest
{
    public int Level { get; set; }
    public int RequiredXp { get; set; }
    public string? Title { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? LastSyncedAt { get; set; }
    public bool? IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}

public sealed class XpConfigUpsertRequest
{
    public string? Id { get; set; }
    public string? SourceType { get; set; }
    public int BaseXp { get; set; }
    public int VariableXp { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? LastSyncedAt { get; set; }
    public bool? IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}

