using System.Text.Json;
using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Attempts.DTOs;
using MemoPal.Application.Features.Education.Relationships;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Attempts.Queries;

public sealed record GetEducationAttemptAttachmentQuery(string UserId, string AttemptId, string QuestionId, string AttachmentId)
    : IRequest<PrivateAttachmentContent>;

public sealed class GetEducationAttemptAttachmentHandler(
    IAppDbContext db, EducationAccess access, IPrivateAttachmentStorage storage)
    : IRequestHandler<GetEducationAttemptAttachmentQuery, PrivateAttachmentContent>
{
    public async Task<PrivateAttachmentContent> Handle(GetEducationAttemptAttachmentQuery q, CancellationToken ct)
    {
        var attempt = await db.EducationAssessmentAttempts.AsNoTracking()
            .Include(x => x.Responses)
            .Include(x => x.Recipient).ThenInclude(x => x!.Assignment)
            .FirstOrDefaultAsync(x => x.Id == q.AttemptId && !x.IsDeleted && x.Recipient != null && !x.Recipient.IsDeleted &&
                x.Recipient.Assignment != null && !x.Recipient.Assignment.IsDeleted, ct)
            ?? throw new NotFoundAppException("Attachment not found.");
        var attachment = await db.EducationAssessmentAttachments.AsNoTracking().FirstOrDefaultAsync(x =>
            x.Id == q.AttachmentId && x.AttemptId == attempt.Id && x.QuestionId == q.QuestionId && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("Attachment not found.");
        var response = attempt.Responses.FirstOrDefault(x => x.QuestionId == q.QuestionId && !x.IsDeleted);
        var answer = response?.AnswerJson is null ? null : JsonSerializer.Deserialize<EducationAttemptAnswerInputDto>(response.AnswerJson);
        if (attachment.UploadedByUserId != attempt.StudentUserId ||
            (answer?.PhotoAttachmentId != attachment.Id && answer?.AudioAttachmentId != attachment.Id))
            throw new NotFoundAppException("Attachment not found.");

        if (q.UserId != attempt.StudentUserId)
        {
            if (attempt.Status != EducationAssessmentAttemptStatuses.Submitted)
                throw new NotFoundAppException("Attachment not found.");
            var assignment = attempt.Recipient!.Assignment!;
            if (assignment.CreatorUserId != q.UserId)
                throw new NotFoundAppException("Attachment not found.");
            if (assignment.ClassroomId is not null && !await access.IsActiveClassTeacherAsync(q.UserId, assignment.ClassroomId, ct))
                throw new NotFoundAppException("Attachment not found.");
            if (assignment.Scope == EducationAssignmentScopes.Family &&
                !await access.IsVerifiedGuardianAsync(q.UserId, attempt.StudentUserId, ct))
                throw new NotFoundAppException("Attachment not found.");
        }

        var assessment = await EducationAttemptValidation.PublishedSnapshotAsync(db, attempt, ct);
        var question = EducationAttemptValidation.Question(assessment, q.QuestionId);
        if (question.Type is not (ObjectiveQuestionTypeCodes.PhotoResponse or ObjectiveQuestionTypeCodes.VoiceResponse))
            throw new NotFoundAppException("Attachment not found.");
        var content = await storage.OpenReadAsync(attachment.StorageKey, ct)
            ?? throw new NotFoundAppException("Attachment not found.");
        if (!string.Equals(content.ContentType, attachment.ContentType, StringComparison.OrdinalIgnoreCase))
        {
            await content.Content.DisposeAsync();
            throw new NotFoundAppException("Attachment not found.");
        }
        return content;
    }
}
