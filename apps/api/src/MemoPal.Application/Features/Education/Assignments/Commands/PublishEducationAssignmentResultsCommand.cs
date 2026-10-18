using System.Security.Cryptography;
using System.Text;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Assignments.DTOs;
using MemoPal.Application.Features.Education.Relationships;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Assignments.Commands;

public sealed record PublishEducationAssignmentResultsCommand(string UserId, string AssignmentId)
    : IRequest<ApiResponse<PublishEducationAssignmentResultsDto>>;

public sealed class PublishEducationAssignmentResultsHandler(IAppDbContext db, EducationAccess access)
    : IRequestHandler<PublishEducationAssignmentResultsCommand, ApiResponse<PublishEducationAssignmentResultsDto>>
{
    public async Task<ApiResponse<PublishEducationAssignmentResultsDto>> Handle(PublishEducationAssignmentResultsCommand q, CancellationToken ct)
    {
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

        if (assignment.ResultsPublishedAt is not null)
            return ApiResponse<PublishEducationAssignmentResultsDto>.Ok(new(assignment.Id, assignment.ResultsPublishedAt.Value));
        var now = DateTime.UtcNow;
        if (now < assignment.DueAt)
            throw new ConflictAppException("Results cannot be published before the assignment due time.");
        var recipientIds = assignment.Recipients.Select(x => x.Id).ToArray();
        var hasOpenAttempt = await db.EducationAssessmentAttempts.AnyAsync(x => recipientIds.Contains(x.RecipientId) &&
            x.Status == EducationAssessmentAttemptStatuses.InProgress && !x.IsDeleted, ct);
        if (hasOpenAttempt)
            throw new ConflictAppException("All started attempts must be submitted before results can be published.");
        var hasUngradedSubmission = await db.EducationAssessmentAttempts.AnyAsync(x => recipientIds.Contains(x.RecipientId) &&
            x.Status == EducationAssessmentAttemptStatuses.Submitted && x.Score == null && !x.IsDeleted, ct);
        if (hasUngradedSubmission)
            throw new ConflictAppException("All submitted written responses must be graded before results can be published.");

        assignment.PublishResults(now);
        if (assignment.Scope == EducationAssignmentScopes.Classroom && assignment.ClassroomId is not null &&
            assignment.RetakeOfAssignmentId is null)
        {
            var scoredRows = await db.EducationAssessmentAttempts.AsNoTracking()
                .Where(x => recipientIds.Contains(x.RecipientId) && x.Status == EducationAssessmentAttemptStatuses.Submitted &&
                    x.AssessmentId == assignment.AssessmentId && x.AssessmentVersion == assignment.AssessmentVersion &&
                    x.Score != null && x.MaxScore != null && !x.IsDeleted &&
                    db.EducationAssignmentRecipients.Any(r => r.Id == x.RecipientId && r.StudentUserId == x.StudentUserId &&
                        r.AssessmentId == x.AssessmentId && r.AssessmentVersion == x.AssessmentVersion && !r.IsDeleted))
                .Select(x => new { x.RecipientId, x.StudentUserId, Score = x.Score!.Value, MaxScore = x.MaxScore!.Value })
                .ToListAsync(ct);
            var aliases = scoredRows.OrderBy(x => Convert.ToHexString(SHA256.HashData(
                    Encoding.UTF8.GetBytes($"{assignment.Id}:{x.StudentUserId}"))), StringComparer.Ordinal)
                .Select((row, index) => (row.StudentUserId, Alias: $"Learner {index + 1:00}"))
                .ToDictionary(x => x.StudentUserId, x => x.Alias, StringComparer.Ordinal);
            foreach (var row in scoredRows)
            {
                var recipient = assignment.Recipients.Single(x => x.Id == row.RecipientId);
                var rank = EducationLeaderboardCalculator.GetCompetitionRank(scoredRows.Select(x => x.Score), row.Score);
                db.EducationAssignmentLeaderboardEntries.Add(new EducationAssignmentLeaderboardEntry
                {
                    AssignmentId = assignment.Id,
                    ResultsPublishedAt = now,
                    StudentUserId = row.StudentUserId,
                    Alias = aliases[row.StudentUserId],
                    IsVisibleToStudents = assignment.StudentLeaderboardEnabled && recipient.IncludeInStudentLeaderboard,
                    Rank = rank,
                    Score = row.Score,
                    MaxScore = row.MaxScore
                });
            }
        }
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateConcurrencyException)
        {
            db.ClearTracking();
            var publishedAt = await db.EducationAssignments.AsNoTracking()
                .Where(x => x.Id == q.AssignmentId && x.CreatorUserId == q.UserId && !x.IsDeleted)
                .Select(x => x.ResultsPublishedAt).FirstOrDefaultAsync(ct);
            if (publishedAt is null) throw new ConflictAppException("Assignment results changed while publishing. Reload and try again.");
            return ApiResponse<PublishEducationAssignmentResultsDto>.Ok(new(q.AssignmentId, publishedAt.Value));
        }
        return ApiResponse<PublishEducationAssignmentResultsDto>.Ok(new(assignment.Id, assignment.ResultsPublishedAt!.Value));
    }
}
