using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

/// <summary>A learner-owned, resumable record for one published public-practice assessment version.</summary>
public sealed class EducationGuidedLearningSession : UserOwnedEntity
{
    public string CourseId { get; set; } = string.Empty;
    public string AssessmentId { get; set; } = string.Empty;
    public int AssessmentVersion { get; set; }
    public int Version { get; set; } = 1;
    public DateTime StartedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAtUtc { get; set; }
    public ICollection<EducationGuidedLearningQuestionProgress> Questions { get; set; } = new List<EducationGuidedLearningQuestionProgress>();
}

/// <summary>Outcome-only state; answer content is never persisted.</summary>
public sealed class EducationGuidedLearningQuestionProgress : AuditableBaseEntity
{
    public string SessionId { get; set; } = string.Empty;
    public string QuestionId { get; set; } = string.Empty;
    public int Position { get; set; }
    public int AttemptCount { get; set; }
    public bool? FirstTryCorrect { get; set; }
    public bool Missed { get; set; }
    public bool Solved { get; set; }
    public bool? LatestCorrect { get; set; }
}

/// <summary>Idempotency receipt for a guided check. Stores only the question identity and outcome.</summary>
public sealed class EducationGuidedLearningCheckReceipt : AuditableBaseEntity
{
    public string SessionId { get; set; } = string.Empty;
    public string RequestId { get; set; } = string.Empty;
    public string QuestionId { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
}
