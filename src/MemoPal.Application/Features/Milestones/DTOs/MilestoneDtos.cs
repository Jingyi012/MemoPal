namespace MemoPal.Application.Features.Milestones.DTOs;

public sealed record MilestoneDto(
    string Id,
    string Key,
    string Title,
    string? Description,
    string ConditionType,
    int ConditionValue,
    DateTime? AchievedAt,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? LastSyncedAt,
    bool IsDeleted,
    DateTime? DeletedAt
);

public sealed record MilestoneDefinitionDto(
    string Id,
    string Key,
    string Title,
    string? Description,
    string ConditionType,
    int ConditionValue,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? LastSyncedAt,
    bool IsDeleted,
    DateTime? DeletedAt,
    string? CreatedBy,
    string? UpdatedBy
);

public sealed class MilestoneDefinitionUpsertRequest
{
    public string? Id { get; set; }
    public string? Key { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? ConditionType { get; set; }
    public int ConditionValue { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? LastSyncedAt { get; set; }
    public bool? IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}
