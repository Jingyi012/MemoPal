using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class CompanionBond : AuditableBaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string AvatarId { get; set; } = string.Empty;
    public int BondPoints { get; set; }
    public DateTime? LastGreetingDateUtc { get; set; }
}

public sealed class CompanionMemory : AuditableBaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string AvatarId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public DateTime OccurredAt { get; set; }
    public string SummaryEn { get; set; } = string.Empty;
    public string SummaryZh { get; set; } = string.Empty;
    public string? SourceId { get; set; }
}

public static class CompanionMemoryTypes
{
    public const string Practice = "practice";
    public const string Greeting = "greeting";
    public const string FirstPracticeMilestone = "milestone_first_practice";
    public const string TenthPracticeMilestone = "milestone_tenth_practice";
    public const string BondStageMilestone = "milestone_bond_stage";
}

public sealed class CompanionLook : AuditableBaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string AvatarId { get; set; } = string.Empty;
    public string? HeadwearId { get; set; }
    public string? BodywearId { get; set; }
    public string? BackwearId { get; set; }
    public string? HandItemId { get; set; }
}

public sealed class CompanionLookPreset : AuditableBaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string AvatarId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? HeadwearId { get; set; }
    public string? BodywearId { get; set; }
    public string? BackwearId { get; set; }
    public string? HandItemId { get; set; }
}
