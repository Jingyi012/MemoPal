using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class EducationQuestion : AuditableBaseEntity
{
    public string AssessmentId { get; set; } = string.Empty;
    public string ObjectiveId { get; set; } = string.Empty;
    public string Prompt { get; set; } = string.Empty;
    public string? Explanation { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? FillMode { get; set; }
    public decimal MaxScore { get; set; }
    public int Position { get; set; }
    public string OptionsJson { get; set; } = "[]";
    public string AnswerKeyJson { get; set; } = "{}";
    public EducationAssessment? Assessment { get; set; }
    public EducationObjective? Objective { get; set; }
}
