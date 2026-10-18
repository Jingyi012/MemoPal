using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Attempts;

internal static class EducationAttemptValidation
{
    public static async Task<EducationAssessment> PublishedSnapshotAsync(
        IAppDbContext db, EducationAssessmentAttempt attempt, CancellationToken ct)
    {
        var assessment = await db.EducationAssessments.Include(x => x.Questions)
            .FirstOrDefaultAsync(x => x.Id == attempt.AssessmentId && !x.IsDeleted, ct);
        if (assessment is null || assessment.Status != EducationAssessmentStatuses.Published ||
            assessment.Version != attempt.AssessmentVersion)
            throw new ConflictAppException("The assigned assessment version is no longer available.");
        return assessment;
    }

    public static async Task<EducationAssessment> PublishedSnapshotAsync(
        IAppDbContext db, EducationAssignmentRecipient recipient, CancellationToken ct)
    {
        var assessment = await db.EducationAssessments.AsNoTracking().Include(x => x.Questions)
            .FirstOrDefaultAsync(x => x.Id == recipient.AssessmentId && !x.IsDeleted, ct);
        if (assessment is null || assessment.Status != EducationAssessmentStatuses.Published ||
            assessment.Version != recipient.AssessmentVersion)
            throw new ConflictAppException("The assigned assessment version is no longer available.");
        return assessment;
    }

    public static EducationQuestion Question(EducationAssessment assessment, string questionId) =>
        assessment.Questions.FirstOrDefault(x => x.Id == questionId && !x.IsDeleted)
        ?? throw new ValidationAppException("Question does not belong to this assigned assessment.");

    public static async Task<EducationAssessmentAttempt> OwnedAttemptAsync(
        IAppDbContext db, string studentUserId, string attemptId, CancellationToken ct) =>
        await db.EducationAssessmentAttempts.Include(x => x.Responses)
            .Include(x => x.Recipient).ThenInclude(x => x!.Assignment)
            .FirstOrDefaultAsync(x => x.Id == attemptId && x.StudentUserId == studentUserId && !x.IsDeleted &&
                x.Recipient != null && x.Recipient.StudentUserId == studentUserId && !x.Recipient.IsDeleted &&
                x.Recipient.Assignment != null && !x.Recipient.Assignment.IsDeleted, ct)
        ?? throw new NotFoundAppException("Attempt not found.");
}
