using System.Text.Json;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Assignments.DTOs;
using MemoPal.Application.Features.Education.Relationships;
using MemoPal.Application.Features.Education.Attempts.DTOs;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Assignments.Queries;

public sealed record GetEducationAssignmentGradebookQuery(string UserId, string AssignmentId)
    : IRequest<ApiResponse<EducationAssignmentGradebookDto>>;

public sealed class GetEducationAssignmentGradebookHandler(IAppDbContext db, EducationAccess access)
    : IRequestHandler<GetEducationAssignmentGradebookQuery, ApiResponse<EducationAssignmentGradebookDto>>
{
    public async Task<ApiResponse<EducationAssignmentGradebookDto>> Handle(GetEducationAssignmentGradebookQuery q, CancellationToken ct)
    {
        var assignment = await db.EducationAssignments.AsNoTracking().Include(x => x.Recipients)
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

        var recipientIds = assignment.Recipients.Select(x => x.Id).ToArray();
        var attempts = await db.EducationAssessmentAttempts.AsNoTracking()
            .Where(x => recipientIds.Contains(x.RecipientId) && !x.IsDeleted)
            .ToDictionaryAsync(x => x.RecipientId, ct);
        var attemptIds = attempts.Values.Select(x => x.Id).ToArray();
        var manualQuestions = await db.EducationQuestions.AsNoTracking()
            .Where(x => x.AssessmentId == assignment.AssessmentId &&
                (x.Type == ObjectiveQuestionTypeCodes.WrittenResponse || x.Type == ObjectiveQuestionTypeCodes.PhotoResponse ||
                 x.Type == ObjectiveQuestionTypeCodes.VoiceResponse) && !x.IsDeleted)
            .ToDictionaryAsync(x => x.Id, ct);
        var submittedAttemptIds = attempts.Values.Where(x => x.Status == EducationAssessmentAttemptStatuses.Submitted).Select(x => x.Id).ToArray();
        var manualQuestionIds = manualQuestions.Keys.ToArray();
        var manualResponses = await db.EducationAssessmentResponses.AsNoTracking()
            .Where(x => submittedAttemptIds.Contains(x.AttemptId) && manualQuestionIds.Contains(x.QuestionId) && !x.IsDeleted)
            .ToListAsync(ct);
        var manualByAttempt = manualResponses.GroupBy(x => x.AttemptId).ToDictionary(group => group.Key, group =>
            group.Select(response =>
            {
                var question = manualQuestions[response.QuestionId];
                var rubric = JsonSerializer.Deserialize<ManualAnswerKey>(question.AnswerKeyJson)?.GradingRubric ?? string.Empty;
                var answer = response.AnswerJson is null
                    ? null
                    : JsonSerializer.Deserialize<EducationAttemptAnswerDto>(response.AnswerJson)?.TextValue;
                var attachmentId = response.AnswerJson is null
                    ? null
                    : JsonSerializer.Deserialize<EducationAttemptAnswerDto>(response.AnswerJson)?.PhotoAttachmentId;
                var audioAttachmentId = response.AnswerJson is null
                    ? null
                    : JsonSerializer.Deserialize<EducationAttemptAnswerDto>(response.AnswerJson)?.AudioAttachmentId;
                return new EducationManualResponseGradeDto(question.Id, question.Prompt, rubric, answer, attachmentId,
                    audioAttachmentId, question.MaxScore, response.Score, response.Feedback, response.GradedByUserId, response.GradedAt);
            }).ToArray());
        var revisionRows = await db.EducationGradeRevisions.AsNoTracking()
            .Where(x => attemptIds.Contains(x.AttemptId) && !x.IsDeleted)
            .OrderByDescending(x => x.CreatedAt).ToListAsync(ct);
        var revisions = revisionRows.GroupBy(x => x.AttemptId).ToDictionary(
            group => group.Key,
            group => group.Select(x => new EducationGradeRevisionDto(x.CorrectedByUserId, x.PreviousScore,
                x.NewScore, x.MaxScore, x.Reason, x.CreatedAt)).ToArray());
        var studentIdsForNames = assignment.Recipients.Select(x => x.StudentUserId).Distinct().ToArray();
        var studentNames = await db.Users.AsNoTracking().Where(x => studentIdsForNames.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x.DisplayName, ct);

        var rows = assignment.Recipients.OrderBy(x => studentNames.GetValueOrDefault(x.StudentUserId), StringComparer.OrdinalIgnoreCase)
            .Select(recipient =>
            {
                attempts.TryGetValue(recipient.Id, out var attempt);
                var attemptRevisions = attempt is not null && revisions.TryGetValue(attempt.Id, out var items) ? items : [];
                var status = attempt is null ? "not-started" :
                    attempt.Status == EducationAssessmentAttemptStatuses.Submitted && attempt.Score is null
                        ? "awaiting-manual-grade"
                        : attempt.Status;
                var manualGrades = attempt is not null && manualByAttempt.TryGetValue(attempt.Id, out var grades) ? grades : [];
                return new EducationAssignmentGradeRowDto(recipient.Id, recipient.StudentUserId,
                    studentNames.GetValueOrDefault(recipient.StudentUserId) ?? "Student", status,
                    attempt?.StartedAt, attempt?.SubmittedAt, attempt?.Score, attempt?.MaxScore,
                    attemptRevisions.Length, attempt?.Id, attemptRevisions, manualGrades);
            }).ToArray();
        return ApiResponse<EducationAssignmentGradebookDto>.Ok(new(assignment.Id, assignment.Title,
            assignment.ResultsPublishedAt, rows));
    }

    private sealed record ManualAnswerKey(string? GradingRubric);
}
