using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public static class EducationAssessmentAttemptStatuses
{
    public const string InProgress = "in-progress";
    public const string Submitted = "submitted";
}

public sealed class EducationAssessmentAttempt : AuditableBaseEntity
{
    public string RecipientId { get; set; } = string.Empty;
    public string StudentUserId { get; set; } = string.Empty;
    public string AssessmentId { get; set; } = string.Empty;
    public int AssessmentVersion { get; set; }
    public string Status { get; private set; } = EducationAssessmentAttemptStatuses.InProgress;
    public int Version { get; private set; } = 1;
    public DateTime StartedAt { get; private set; }
    public DateTime ExpiresAt { get; private set; }
    public DateTime? SubmittedAt { get; private set; }
    public decimal? Score { get; private set; }
    public decimal? MaxScore { get; private set; }
    public EducationAssignmentRecipient? Recipient { get; set; }
    public ICollection<EducationAssessmentResponse> Responses { get; set; } = new List<EducationAssessmentResponse>();

    public void SaveResponse(string questionId, string? answerJson, int expectedVersion, DateTime nowUtc)
    {
        EnsureEditable(expectedVersion, nowUtc);
        var response = Responses.FirstOrDefault(x => x.QuestionId == questionId && !x.IsDeleted);
        if (response is null)
        {
            response = new EducationAssessmentResponse { AttemptId = Id, QuestionId = questionId };
            Responses.Add(response);
        }
        response.SaveAnswer(answerJson);
        Version++;
    }

    public void Submit(decimal? score, decimal maxScore, DateTime submittedAtUtc)
    {
        if (Status == EducationAssessmentAttemptStatuses.Submitted) return;
        if (Status != EducationAssessmentAttemptStatuses.InProgress)
            throw new InvalidOperationException("Only an in-progress attempt can be submitted.");
        if (submittedAtUtc > ExpiresAt)
            throw new InvalidOperationException("Submission time cannot be later than the attempt expiry.");
        if (score is < 0 || maxScore < 0 || (score.HasValue && score.Value > maxScore))
            throw new ArgumentOutOfRangeException(nameof(score));
        Status = EducationAssessmentAttemptStatuses.Submitted;
        SubmittedAt = DateTime.SpecifyKind(submittedAtUtc, DateTimeKind.Utc);
        Score = score;
        MaxScore = maxScore;
        Version++;
    }

    public void CorrectFinalScore(decimal score)
    {
        if (Status != EducationAssessmentAttemptStatuses.Submitted || MaxScore is null)
            throw new InvalidOperationException("Only a submitted attempt can have its final grade corrected.");
        if (score < 0 || score > MaxScore)
            throw new ArgumentOutOfRangeException(nameof(score));
        Score = score;
        Version++;
    }

    public void CompleteManualGrading(decimal score)
    {
        if (Status != EducationAssessmentAttemptStatuses.Submitted || Score is not null || MaxScore is null)
            throw new InvalidOperationException("Only a submitted attempt awaiting manual grading can be finalized.");
        if (score < 0 || score > MaxScore.Value)
            throw new ArgumentOutOfRangeException(nameof(score));
        Score = score;
        Version++;
    }

    public void RecordManualGradeProgress()
    {
        if (Status != EducationAssessmentAttemptStatuses.Submitted || Score is not null)
            throw new InvalidOperationException("Only a submitted attempt awaiting manual grading can be updated.");
        Version++;
    }

    public void EnsureEditable(int expectedVersion, DateTime nowUtc)
    {
        if (Status != EducationAssessmentAttemptStatuses.InProgress)
            throw new InvalidOperationException("Submitted attempts cannot be changed.");
        if (expectedVersion != Version)
            throw new InvalidOperationException("The attempt changed. Reload before saving.");
        if (nowUtc >= ExpiresAt)
            throw new InvalidOperationException("The attempt has expired.");
    }

    public static EducationAssessmentAttempt Start(EducationAssignmentRecipient recipient, DateTime startedAtUtc)
    {
        var started = DateTime.SpecifyKind(startedAtUtc, DateTimeKind.Utc);
        var expires = recipient.TimeLimitMinutes is int minutes
            ? MinUtc(recipient.DueAt, started.AddMinutes(minutes))
            : recipient.DueAt;
        return new EducationAssessmentAttempt
        {
            RecipientId = recipient.Id,
            StudentUserId = recipient.StudentUserId,
            AssessmentId = recipient.AssessmentId,
            AssessmentVersion = recipient.AssessmentVersion,
            StartedAt = started,
            ExpiresAt = expires,
            Recipient = recipient
        };
    }

    private static DateTime MinUtc(DateTime left, DateTime right) => left <= right ? left : right;
}

public sealed class EducationGradeRevision : AuditableBaseEntity
{
    public string AttemptId { get; set; } = string.Empty;
    public string CorrectedByUserId { get; set; } = string.Empty;
    public decimal PreviousScore { get; set; }
    public decimal NewScore { get; set; }
    public decimal MaxScore { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime? PreviousResultsPublishedAt { get; set; }
}

public sealed class EducationAssessmentResponse : AuditableBaseEntity
{
    public string AttemptId { get; set; } = string.Empty;
    public string QuestionId { get; set; } = string.Empty;
    public string? AnswerJson { get; private set; }
    public decimal? Score { get; private set; }
    public bool? IsCorrect { get; private set; }
    public string? Feedback { get; private set; }
    public string? GradedByUserId { get; private set; }
    public DateTime? GradedAt { get; private set; }
    public EducationAssessmentAttempt? Attempt { get; set; }

    public void SaveAnswer(string? answerJson)
    {
        if (Score.HasValue || IsCorrect.HasValue)
            throw new InvalidOperationException("Graded responses cannot be changed.");
        AnswerJson = answerJson;
    }

    public void RecordGrade(decimal score, bool? isCorrect, string? feedback = null, string? gradedByUserId = null, DateTime? gradedAtUtc = null)
    {
        if (Score.HasValue || IsCorrect.HasValue)
            throw new InvalidOperationException("A response can only be graded once.");
        if (score < 0) throw new ArgumentOutOfRangeException(nameof(score));
        Score = score;
        IsCorrect = isCorrect;
        Feedback = feedback;
        GradedByUserId = gradedByUserId;
        GradedAt = gradedAtUtc is null ? null : DateTime.SpecifyKind(gradedAtUtc.Value, DateTimeKind.Utc);
    }
}
