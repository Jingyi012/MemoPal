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

public sealed record GradeEducationManualResponseCommand(
    string UserId, string AssignmentId, string AttemptId, string QuestionId, GradeEducationManualResponseRequest Request)
    : IRequest<ApiResponse<GradeEducationManualResponseDto>>;

public sealed class GradeEducationManualResponseHandler(IAppDbContext db, EducationAccess access)
    : IRequestHandler<GradeEducationManualResponseCommand, ApiResponse<GradeEducationManualResponseDto>>
{
    public async Task<ApiResponse<GradeEducationManualResponseDto>> Handle(GradeEducationManualResponseCommand q, CancellationToken ct)
    {
        if (q.Request.Score < 0 || decimal.Round(q.Request.Score, 2) != q.Request.Score)
            throw new ValidationAppException("The score must be non-negative and use at most two decimal places.");
        var feedback = q.Request.Feedback?.Trim();
        if (feedback?.Length > 1000)
            throw new ValidationAppException("Feedback must be 1000 characters or fewer.");

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
            throw new ConflictAppException("Manual responses cannot be graded after results are published.");

        var recipientIds = assignment.Recipients.Where(x => !x.IsDeleted).Select(x => x.Id).ToArray();
        var attempt = await db.EducationAssessmentAttempts.Include(x => x.Responses)
            .FirstOrDefaultAsync(x => x.Id == q.AttemptId && recipientIds.Contains(x.RecipientId) && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("Submitted attempt not found.");
        if (attempt.Status != EducationAssessmentAttemptStatuses.Submitted)
            throw new ConflictAppException("The student must submit the attempt before grading.");
        var question = await db.EducationQuestions.AsNoTracking().FirstOrDefaultAsync(x =>
            x.Id == q.QuestionId && x.AssessmentId == assignment.AssessmentId && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("Manual-response question not found.");
        if (question.Type is not (ObjectiveQuestionTypeCodes.WrittenResponse or ObjectiveQuestionTypeCodes.PhotoResponse or ObjectiveQuestionTypeCodes.VoiceResponse))
            throw new ValidationAppException("Only manual-response questions support manual grading.");
        if (q.Request.Score > question.MaxScore)
            throw new ValidationAppException("The score cannot exceed the question maximum.");
        var response = attempt.Responses.FirstOrDefault(x => x.QuestionId == question.Id && !x.IsDeleted)
            ?? throw new NotFoundAppException("Student response not found.");
        if (response.AnswerJson is null)
            throw new ConflictAppException("An unanswered question is already scored as zero.");
        if (response.Score.HasValue)
            throw new ConflictAppException("This response has already been graded.");

        response.RecordGrade(q.Request.Score, null, feedback, q.UserId, DateTime.UtcNow);
        var responses = attempt.Responses.Where(x => !x.IsDeleted).ToArray();
        var questionRows = await db.EducationQuestions.AsNoTracking()
            .Where(x => x.AssessmentId == assignment.AssessmentId && !x.IsDeleted)
            .Select(x => new { x.Id, x.MaxScore }).ToListAsync(ct);
        if (responses.Length != questionRows.Count)
            throw new ConflictAppException("The submitted response set does not match the published assessment.");
        var fullyGraded = responses.All(x => x.Score.HasValue);
        if (fullyGraded)
        {
            var score = responses.Sum(x => x.Score!.Value);
            try { attempt.CompleteManualGrading(score); }
            catch (InvalidOperationException ex) { throw new ConflictAppException(ex.Message); }
        }
        else
        {
            try { attempt.RecordManualGradeProgress(); }
            catch (InvalidOperationException ex) { throw new ConflictAppException(ex.Message); }
        }
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateConcurrencyException) { throw new ConflictAppException("The response changed while it was being graded. Reload and try again."); }

        return ApiResponse<GradeEducationManualResponseDto>.Ok(new(assignment.Id, attempt.Id, question.Id,
            attempt.Score, attempt.MaxScore ?? questionRows.Sum(x => x.MaxScore), fullyGraded));
    }
}
