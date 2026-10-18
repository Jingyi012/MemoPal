using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Assignments.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Assignments;

internal static class AssignmentValidation
{
    public static (string Title, DateTime OpensAt, DateTime DueAt, string Key) Validate(
        string? title, DateTime opensAt, DateTime dueAt, int? timeLimitMinutes, string? idempotencyKey)
    {
        var normalizedTitle = title?.Trim();
        if (string.IsNullOrWhiteSpace(normalizedTitle) || normalizedTitle.Length > 200)
            throw new ValidationAppException("Assignment title is required and must be 200 characters or fewer.");
        if (opensAt.Kind != DateTimeKind.Utc || dueAt.Kind != DateTimeKind.Utc || dueAt <= opensAt)
            throw new ValidationAppException("Open and due times must be UTC, and the due time must be after the open time.");
        if (timeLimitMinutes is <= 0)
            throw new ValidationAppException("Time limit must be a positive number of minutes.");
        var key = idempotencyKey?.Trim();
        if (string.IsNullOrWhiteSpace(key) || key.Length > 100)
            throw new ValidationAppException("An idempotency key of at most 100 characters is required.");
        return (normalizedTitle, opensAt, dueAt, key);
    }

    public static async Task<EducationAssessment> PublishedAssessmentAsync(
        IAppDbContext db, string creatorUserId, string assessmentId, CancellationToken ct)
    {
        var assessment = await db.EducationAssessments.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == assessmentId && !x.IsDeleted, ct);
        if (assessment is null || assessment.UserId != creatorUserId || assessment.Status != EducationAssessmentStatuses.Published)
            throw new NotFoundAppException("Published assessment not found.");
        return assessment;
    }

    public static EducationAssignmentDto ToDto(EducationAssignment assignment) => new(
        assignment.Id, assignment.Scope, assignment.ClassroomId, assignment.AssessmentId,
        assignment.AssessmentVersion, assignment.Title, assignment.OpensAt, assignment.DueAt,
        assignment.TimeLimitMinutes, assignment.CreatedAt, assignment.ResultsPublishedAt, assignment.StudentLeaderboardEnabled,
        assignment.Recipients.OrderBy(x => x.StudentUserId, StringComparer.Ordinal)
            .Select(x => new EducationAssignmentRecipientDto(x.Id, x.StudentUserId, x.AssessmentId,
                x.AssessmentVersion, x.Title, x.OpensAt, x.DueAt, x.TimeLimitMinutes, x.IncludeInStudentLeaderboard)).ToArray(),
        assignment.RetakeOfAssignmentId, assignment.RetakeReason);

    public static bool Matches(EducationAssignment assignment, string scope, string? classroomId,
        string assessmentId, int version, string title, DateTime opensAt, DateTime dueAt,
        int? timeLimitMinutes, IEnumerable<string> studentIds, bool enableStudentLeaderboard = false)
    {
        var targets = studentIds.Order(StringComparer.Ordinal).ToArray();
        var existing = assignment.Recipients.Select(x => x.StudentUserId).Order(StringComparer.Ordinal).ToArray();
        return assignment.Scope == scope && assignment.ClassroomId == classroomId &&
            assignment.AssessmentId == assessmentId && assignment.AssessmentVersion == version &&
            assignment.Title == title && assignment.OpensAt == opensAt && assignment.DueAt == dueAt &&
            assignment.TimeLimitMinutes == timeLimitMinutes && assignment.StudentLeaderboardEnabled == enableStudentLeaderboard &&
            targets.SequenceEqual(existing, StringComparer.Ordinal);
    }

    public static string[] NormalizeStudentIds(IReadOnlyList<string>? studentIds)
    {
        if (studentIds is null || studentIds.Count == 0 || studentIds.Any(string.IsNullOrWhiteSpace))
            throw new ValidationAppException("At least one student is required.");
        var ids = studentIds.Select(x => x.Trim()).ToArray();
        if (ids.Distinct(StringComparer.Ordinal).Count() != ids.Length)
            throw new ValidationAppException("Student IDs must be unique.");
        return ids;
    }

    public static EducationAssignment Create(string creatorId, string scope, string? classroomId,
        EducationAssessment assessment, string title, DateTime opensAt, DateTime dueAt,
        int? timeLimitMinutes, string key, IEnumerable<string> studentIds, bool enableStudentLeaderboard = false,
        string? retakeOfAssignmentId = null, string? retakeReason = null)
    {
        var assignment = new EducationAssignment
        {
            CreatorUserId = creatorId, Scope = scope, ClassroomId = classroomId,
            AssessmentId = assessment.Id, AssessmentVersion = assessment.Version,
            Title = title, OpensAt = opensAt, DueAt = dueAt, TimeLimitMinutes = timeLimitMinutes,
            IdempotencyKey = key, StudentLeaderboardEnabled = scope == EducationAssignmentScopes.Classroom && enableStudentLeaderboard,
            RetakeOfAssignmentId = retakeOfAssignmentId, RetakeReason = retakeReason
        };
        foreach (var studentId in studentIds)
            assignment.Recipients.Add(new EducationAssignmentRecipient
            {
                AssignmentId = assignment.Id, StudentUserId = studentId,
                AssessmentId = assessment.Id, AssessmentVersion = assessment.Version,
                Title = title, OpensAt = opensAt, DueAt = dueAt, TimeLimitMinutes = timeLimitMinutes
            });
        return assignment;
    }
}
