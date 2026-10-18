using System.Text.Json;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Attempts.DTOs;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Attempts.Commands;

public sealed record SaveEducationAssessmentResponseCommand(
    string UserId, string AttemptId, SaveEducationAttemptResponseRequest Request)
    : IRequest<ApiResponse<EducationAttemptSaveDto>>;

public sealed class SaveEducationAssessmentResponseHandler(IAppDbContext db)
    : IRequestHandler<SaveEducationAssessmentResponseCommand, ApiResponse<EducationAttemptSaveDto>>
{
    public async Task<ApiResponse<EducationAttemptSaveDto>> Handle(SaveEducationAssessmentResponseCommand q, CancellationToken ct)
    {
        if (q.Request.Clear == (q.Request.Answer is not null))
            throw new ValidationAppException("Provide either an answer or clear=true, but not both.");
        var attempt = await EducationAttemptValidation.OwnedAttemptAsync(db, q.UserId, q.AttemptId, ct);
        var assessment = await EducationAttemptValidation.PublishedSnapshotAsync(db, attempt, ct);
        var question = EducationAttemptValidation.Question(assessment, q.Request.QuestionId);
        string? answerJson = null;
        if (!q.Request.Clear)
        {
            _ = EducationAttemptMapping.ParseAnswer(q.Request.Answer, question);
            if (question.Type is ObjectiveQuestionTypeCodes.PhotoResponse or ObjectiveQuestionTypeCodes.VoiceResponse)
            {
                var attachmentId = question.Type == ObjectiveQuestionTypeCodes.PhotoResponse
                    ? q.Request.Answer!.PhotoAttachmentId!
                    : q.Request.Answer!.AudioAttachmentId!;
                var belongsToAttempt = await db.EducationAssessmentAttachments.AnyAsync(x =>
                    x.Id == attachmentId && x.AttemptId == attempt.Id && x.QuestionId == question.Id &&
                    x.UploadedByUserId == q.UserId && !x.IsDeleted, ct);
                if (!belongsToAttempt)
                    throw new ValidationAppException("Upload a response attachment for this question before saving the response.");
            }
            answerJson = JsonSerializer.Serialize(q.Request.Answer);
        }
        try
        {
            attempt.SaveResponse(question.Id, answerJson, q.Request.ExpectedVersion, DateTime.UtcNow);
            await db.SaveChangesAsync(ct);
        }
        catch (InvalidOperationException ex) { throw new ConflictAppException(ex.Message); }
        catch (DbUpdateConcurrencyException) { throw new ConflictAppException("The attempt changed while saving. Reload the latest version."); }
        return ApiResponse<EducationAttemptSaveDto>.Ok(new(attempt.Id, attempt.Version, attempt.Status));
    }
}
