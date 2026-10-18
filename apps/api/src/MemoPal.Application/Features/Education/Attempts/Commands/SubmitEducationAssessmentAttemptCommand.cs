using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Attempts.DTOs;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Attempts.Commands;

public sealed record SubmitEducationAssessmentAttemptCommand(string UserId, string AttemptId)
    : IRequest<ApiResponse<EducationAttemptSubmitDto>>;

public sealed class SubmitEducationAssessmentAttemptHandler(IAppDbContext db)
    : IRequestHandler<SubmitEducationAssessmentAttemptCommand, ApiResponse<EducationAttemptSubmitDto>>
{
    public async Task<ApiResponse<EducationAttemptSubmitDto>> Handle(SubmitEducationAssessmentAttemptCommand q, CancellationToken ct)
    {
        var attempt = await EducationAttemptValidation.OwnedAttemptAsync(db, q.UserId, q.AttemptId, ct);
        if (attempt.Status == EducationAssessmentAttemptStatuses.Submitted)
            return ApiResponse<EducationAttemptSubmitDto>.Ok(EducationAttemptMapping.ToSubmitDto(attempt));
        var assessment = await EducationAttemptValidation.PublishedSnapshotAsync(db, attempt, ct);
        var now = DateTime.UtcNow;
        var submittedAt = now >= attempt.ExpiresAt ? attempt.ExpiresAt : now;

        decimal score = 0;
        decimal maxScore = 0;
        var awaitingManualGrade = false;
        foreach (var question in assessment.Questions.Where(x => !x.IsDeleted).OrderBy(x => x.Position))
        {
            var response = attempt.Responses.FirstOrDefault(x => x.QuestionId == question.Id && !x.IsDeleted);
            if (response is null)
            {
                response = new EducationAssessmentResponse { AttemptId = attempt.Id, QuestionId = question.Id };
                attempt.Responses.Add(response);
            }
            var max = question.MaxScore;
            if (question.Type is ObjectiveQuestionTypeCodes.WrittenResponse or ObjectiveQuestionTypeCodes.PhotoResponse or ObjectiveQuestionTypeCodes.VoiceResponse)
            {
                maxScore += max;
                var manualAnswer = response.AnswerJson is null
                    ? null
                    : System.Text.Json.JsonSerializer.Deserialize<EducationAttemptAnswerInputDto>(response.AnswerJson);
                var hasAnswer = question.Type == ObjectiveQuestionTypeCodes.WrittenResponse
                    ? !string.IsNullOrWhiteSpace(manualAnswer?.TextValue)
                    : !string.IsNullOrWhiteSpace(question.Type == ObjectiveQuestionTypeCodes.PhotoResponse
                            ? manualAnswer?.PhotoAttachmentId
                            : manualAnswer?.AudioAttachmentId) &&
                        await db.EducationAssessmentAttachments.AnyAsync(x => x.Id == (question.Type == ObjectiveQuestionTypeCodes.PhotoResponse
                                ? manualAnswer!.PhotoAttachmentId
                                : manualAnswer!.AudioAttachmentId) &&
                            x.AttemptId == attempt.Id && x.QuestionId == question.Id && x.UploadedByUserId == q.UserId && !x.IsDeleted, ct);
                if (!hasAnswer)
                {
                    response.RecordGrade(0, false);
                }
                else
                {
                    awaitingManualGrade = true;
                }
                continue;
            }
            ObjectiveQuestionGrade grade;
            if (response.AnswerJson is null)
                grade = new ObjectiveQuestionGrade(0, max, false);
            else
            {
                var input = EducationAttemptMapping.DeserializeAnswer(response.AnswerJson, question);
                grade = ObjectiveQuestionScorer.Grade(EducationAttemptMapping.Definition(question), input);
            }
            response.RecordGrade(grade.Score, grade.IsCorrect);
            score += grade.Score;
            maxScore += max;
        }
        try
        {
            attempt.Submit(awaitingManualGrade ? null : score, maxScore, submittedAt);
            await db.SaveChangesAsync(ct);
        }
        catch (InvalidOperationException ex) { throw new ConflictAppException(ex.Message); }
        catch (DbUpdateConcurrencyException)
        {
            db.ClearTracking();
            var retry = await EducationAttemptValidation.OwnedAttemptAsync(db, q.UserId, q.AttemptId, ct);
            if (retry.Status == EducationAssessmentAttemptStatuses.Submitted)
                return ApiResponse<EducationAttemptSubmitDto>.Ok(EducationAttemptMapping.ToSubmitDto(retry));
            throw new ConflictAppException("The attempt changed while submitting. Reload and try again.");
        }
        return ApiResponse<EducationAttemptSubmitDto>.Ok(EducationAttemptMapping.ToSubmitDto(attempt));
    }
}
