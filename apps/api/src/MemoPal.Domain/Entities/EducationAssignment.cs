using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public static class EducationAssignmentScopes
{
    public const string Classroom = "classroom";
    public const string Family = "family";
}

public sealed class EducationAssignment : AuditableBaseEntity
{
    public string CreatorUserId { get; set; } = string.Empty;
    public string Scope { get; set; } = EducationAssignmentScopes.Classroom;
    public string? ClassroomId { get; set; }
    public string? RetakeOfAssignmentId { get; set; }
    public string? RetakeReason { get; set; }
    public string AssessmentId { get; set; } = string.Empty;
    public int AssessmentVersion { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime OpensAt { get; set; }
    public DateTime DueAt { get; set; }
    public int? TimeLimitMinutes { get; set; }
    public bool StudentLeaderboardEnabled { get; set; }
    public string IdempotencyKey { get; set; } = string.Empty;
    public DateTime? ResultsPublishedAt { get; private set; }
    public ICollection<EducationAssignmentRecipient> Recipients { get; set; } = new List<EducationAssignmentRecipient>();
    public EducationAssignment? RetakeOfAssignment { get; set; }

    public bool PublishResults(DateTime publishedAtUtc)
    {
        if (ResultsPublishedAt.HasValue) return false;
        ResultsPublishedAt = DateTime.SpecifyKind(publishedAtUtc, DateTimeKind.Utc);
        return true;
    }

    public DateTime? UnpublishResultsForCorrection()
    {
        var previous = ResultsPublishedAt;
        ResultsPublishedAt = null;
        return previous;
    }
}

public sealed class EducationAssignmentRecipient : AuditableBaseEntity
{
    public string AssignmentId { get; set; } = string.Empty;
    public string StudentUserId { get; set; } = string.Empty;
    public string AssessmentId { get; set; } = string.Empty;
    public int AssessmentVersion { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime OpensAt { get; set; }
    public DateTime DueAt { get; set; }
    public int? TimeLimitMinutes { get; set; }
    public bool IncludeInStudentLeaderboard { get; set; }
    public EducationAssignment? Assignment { get; set; }
}
