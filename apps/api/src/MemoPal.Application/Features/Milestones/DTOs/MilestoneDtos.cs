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
    string? CreatedBy,
    string? UpdatedBy,
    bool IsDeleted,
    DateTime? DeletedAt,
    string? DeletedBy
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
    bool IsDeleted,
    DateTime? DeletedAt,
    string? CreatedBy,
    string? UpdatedBy,
    string? DeletedBy
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
    public bool? IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}
