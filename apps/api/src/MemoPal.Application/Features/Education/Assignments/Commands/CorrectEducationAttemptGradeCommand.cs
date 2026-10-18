using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Assignments.DTOs;
using MemoPal.Application.Features.Education.Relationships;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Assignments.Commands;

public sealed record CorrectEducationAttemptGradeRequest(decimal Score, string Reason);

public sealed record CorrectEducationAttemptGradeCommand(
    string UserId, string AssignmentId, string AttemptId, CorrectEducationAttemptGradeRequest Request)
    : IRequest<ApiResponse<CorrectEducationAttemptGradeDto>>;

public sealed class CorrectEducationAttemptGradeHandler(IAppDbContext db, EducationAccess access)
    : IRequestHandler<CorrectEducationAttemptGradeCommand, ApiResponse<CorrectEducationAttemptGradeDto>>
{
    public async Task<ApiResponse<CorrectEducationAttemptGradeDto>> Handle(CorrectEducationAttemptGradeCommand q, CancellationToken ct)
    {
        var reason = q.Request.Reason?.Trim();
        if (string.IsNullOrWhiteSpace(reason) || reason.Length > 1000)
            throw new ValidationAppException("A correction reason of at most 1000 characters is required.");
        if (q.Request.Score < 0 || decimal.Round(q.Request.Score, 2) != q.Request.Score)
            throw new ValidationAppException("The corrected score must be non-negative and use at most two decimal places.");

        var assignment = await db.EducationAssignments.Include(x => x.Recipients)
            .FirstOrDefaultAsync(x => x.Id == q.AssignmentId && x.CreatorUserId == q.UserId && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("Assignment not found.");
        if (assignment.ClassroomId is not null && !await access.IsActiveClassTeacherAsync(q.UserId, assignment.ClassroomId, ct))
            throw new NotFoundAppException("Assignment not found.");
        if (assignment.Scope == EducationAssignmentScopes.Family)
        {
            var studentIds = assignment.Recipients.Select(x => x.StudentUserId).ToArray();
            var linkedCount = await db.EducationGuardianLinks.CountAsync(x => x.GuardianUserId == q.UserId &&
                studentIds.Contains(x.StudentUserId) && x.Status == EducationRelationshipStatuses.Active &&
                x.StudentConfirmedAt != null && x.AdminVerifiedAt != null && !x.IsDeleted, ct);
            if (linkedCount != studentIds.Length) throw new NotFoundAppException("Assignment not found.");
        }

        var attempt = await db.EducationAssessmentAttempts.FirstOrDefaultAsync(x => x.Id == q.AttemptId && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("Attempt not found.");
        var recipient = assignment.Recipients.FirstOrDefault(x => x.Id == attempt.RecipientId && !x.IsDeleted)
            ?? throw new NotFoundAppException("Attempt not found.");
        if (attempt.Status != EducationAssessmentAttemptStatuses.Submitted)
            throw new NotFoundAppException("Submitted attempt not found.");
        if (attempt.Score is null || attempt.MaxScore is null)
            throw new ConflictAppException("The submitted attempt has no final score to correct.");
        if (q.Request.Score > attempt.MaxScore.Value)
            throw new ValidationAppException("The corrected score cannot exceed the assessment maximum.");
        if (q.Request.Score == attempt.Score.Value)
            throw new ValidationAppException("The corrected score must differ from the current score.");

        var previousPublication = assignment.UnpublishResultsForCorrection();
        var revision = new EducationGradeRevision
        {
            AttemptId = attempt.Id,
            CorrectedByUserId = q.UserId,
            PreviousScore = attempt.Score.Value,
            NewScore = q.Request.Score,
            MaxScore = attempt.MaxScore.Value,
            Reason = reason,
            PreviousResultsPublishedAt = previousPublication
        };
        attempt.CorrectFinalScore(q.Request.Score);
        db.EducationGradeRevisions.Add(revision);
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConflictAppException("The grade changed while it was being corrected. Reload and try again.");
        }

        return ApiResponse<CorrectEducationAttemptGradeDto>.Ok(new(
            assignment.Id, attempt.Id, revision.Id, attempt.Score.Value, attempt.MaxScore.Value,
            assignment.ResultsPublishedAt, revision.CreatedAt));
    }
}
