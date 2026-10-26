using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class EducationCourse : AuditableBaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public bool IsPublic { get; private set; }
    public DateTime? PubliclyPublishedAt { get; private set; }
    public string? NotConfidentialExamContentConfirmedByUserId { get; private set; }
    public DateTime? NotConfidentialExamContentConfirmedAtUtc { get; private set; }
    public bool IsModerationHidden { get; private set; }
    public DateTime? ModerationHiddenAtUtc { get; private set; }
    public string? ModerationHiddenReason { get; private set; }
    public ICollection<EducationObjective> Objectives { get; set; } = new List<EducationObjective>();
    public ICollection<EducationAssessment> Assessments { get; set; } = new List<EducationAssessment>();

    public void SetPublic(bool isPublic, DateTime nowUtc)
    {
        if (IsPublic == isPublic) return;
        IsPublic = isPublic;
        PubliclyPublishedAt = isPublic ? DateTime.SpecifyKind(nowUtc, DateTimeKind.Utc) : null;
    }

    public void ConfirmNotConfidentialExamContent(string userId, DateTime nowUtc)
    {
        NotConfidentialExamContentConfirmedByUserId = userId;
        NotConfidentialExamContentConfirmedAtUtc = DateTime.SpecifyKind(nowUtc, DateTimeKind.Utc);
    }

    public void SetModerationHidden(bool hidden, string? reason, DateTime nowUtc)
    {
        IsModerationHidden = hidden;
        ModerationHiddenAtUtc = hidden ? DateTime.SpecifyKind(nowUtc, DateTimeKind.Utc) : null;
        ModerationHiddenReason = hidden ? reason?.Trim() : null;
    }
}
