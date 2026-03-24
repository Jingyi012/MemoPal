namespace MemoPal.Application.Features.Badges.DTOs;

public sealed record BadgeDto(
    string Id,
    string Key,
    string Name,
    string? Description,
    string? Icon,
    string? IconUrl,
    string? Rarity,
    string ConditionType,
    int ConditionValue,
    DateTime? EarnedAt,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    bool IsDeleted,
    DateTime? DeletedAt
);

public sealed record BadgeDefinitionDto(
    string Id,
    string Key,
    string Name,
    string? Description,
    string? Icon,
    string? IconUrl,
    string? Rarity,
    string ConditionType,
    int ConditionValue,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    bool IsDeleted,
    DateTime? DeletedAt,
    string? CreatedBy,
    string? UpdatedBy
);

public sealed class BadgeDefinitionUpsertRequest
{
    public string? Id { get; set; }
    public string? Key { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public string? IconUrl { get; set; }
    public string? Rarity { get; set; }
    public string? ConditionType { get; set; }
    public int? ConditionValue { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool? IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}
