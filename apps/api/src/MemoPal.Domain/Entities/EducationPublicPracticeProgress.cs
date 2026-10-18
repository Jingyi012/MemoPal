using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

/// <summary>Private learner-only summary of the most recent check for a public practice question.</summary>
public sealed class EducationPublicPracticeProgress : UserOwnedEntity
{
    public string CourseId { get; set; } = string.Empty;
    public string AssessmentId { get; set; } = string.Empty;
    public string QuestionId { get; set; } = string.Empty;
    public bool LastAnswerCorrect { get; set; }
    public DateTime LastAnsweredAtUtc { get; set; }
}
