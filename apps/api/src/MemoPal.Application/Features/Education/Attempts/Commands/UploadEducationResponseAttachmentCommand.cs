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

public sealed record UploadEducationResponseAttachmentCommand(
    string UserId, string AttemptId, string QuestionId, int ExpectedVersion, long Length,
    string ContentType, Stream Content)
    : IRequest<ApiResponse<EducationAttachmentUploadDto>>;

public sealed class UploadEducationResponseAttachmentHandler(IAppDbContext db, IPrivateAttachmentStorage storage)
    : IRequestHandler<UploadEducationResponseAttachmentCommand, ApiResponse<EducationAttachmentUploadDto>>
{
    private const long MaxFileLength = 10_000_000;

    public async Task<ApiResponse<EducationAttachmentUploadDto>> Handle(UploadEducationResponseAttachmentCommand q, CancellationToken ct)
    {
        if (q.Length is <= 0 or > MaxFileLength)
            throw new ValidationAppException("Response attachments must be between 1 byte and 10 MB.");
        var attempt = await EducationAttemptValidation.OwnedAttemptAsync(db, q.UserId, q.AttemptId, ct);
        var now = DateTime.UtcNow;
        try { attempt.EnsureEditable(q.ExpectedVersion, now); }
        catch (InvalidOperationException ex) { throw new ConflictAppException(ex.Message); }

        var assessment = await EducationAttemptValidation.PublishedSnapshotAsync(db, attempt, ct);
        var question = EducationAttemptValidation.Question(assessment, q.QuestionId);
        var (extension, contentType) = await ResolveFormatAsync(q.Content, q.ContentType, question.Type, ct);

        var storageKey = await storage.SaveAsync(q.Content, extension, ct);
        var attachmentId = Guid.NewGuid().ToString("D");
        var oldKeys = new List<string>();
        var existing = attempt.Responses.FirstOrDefault(x => x.QuestionId == question.Id && !x.IsDeleted);
        if (existing?.AnswerJson is not null)
        {
            var previousAnswer = JsonSerializer.Deserialize<EducationAttemptAnswerInputDto>(existing.AnswerJson);
            var previousId = previousAnswer?.PhotoAttachmentId ?? previousAnswer?.AudioAttachmentId;
            if (!string.IsNullOrWhiteSpace(previousId))
            {
                var previous = await db.EducationAssessmentAttachments.FirstOrDefaultAsync(x =>
                    x.Id == previousId && x.AttemptId == attempt.Id && !x.IsDeleted, ct);
                if (previous is not null)
                {
                    oldKeys.Add(previous.StorageKey);
                    previous.IsDeleted = true;
                    previous.DeletedAt = now;
                    previous.DeletedBy = q.UserId;
                }
            }
        }

        db.EducationAssessmentAttachments.Add(new EducationAssessmentAttachment
        {
            Id = attachmentId,
            AttemptId = attempt.Id,
            QuestionId = question.Id,
            UploadedByUserId = q.UserId,
            StorageKey = storageKey,
            ContentType = contentType,
            Length = q.Length
        });
        var answer = question.Type == ObjectiveQuestionTypeCodes.PhotoResponse
            ? new EducationAttemptAnswerInputDto("photo-response", PhotoAttachmentId: attachmentId)
            : new EducationAttemptAnswerInputDto("voice-response", AudioAttachmentId: attachmentId);
        var answerJson = JsonSerializer.Serialize(answer);
        try
        {
            attempt.SaveResponse(question.Id, answerJson, q.ExpectedVersion, now);
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            await storage.DeleteAsync(storageKey, ct);
            throw new ConflictAppException("The attempt changed while the attachment was uploading. Reload and try again.");
        }
        catch (InvalidOperationException ex)
        {
            await storage.DeleteAsync(storageKey, ct);
            throw new ConflictAppException(ex.Message);
        }
        catch
        {
            await storage.DeleteAsync(storageKey, ct);
            throw;
        }

        foreach (var oldKey in oldKeys)
            await storage.DeleteAsync(oldKey, ct);
        return ApiResponse<EducationAttachmentUploadDto>.Ok(new(attachmentId, attempt.Version));
    }

    private static async Task<(string Extension, string ContentType)> ResolveFormatAsync(
        Stream content, string declaredContentType, string questionType, CancellationToken ct)
    {
        if (!content.CanSeek) throw new ValidationAppException("Response attachment stream must support validation.");
        var originalPosition = content.Position;
        var header = new byte[12];
        var read = await content.ReadAsync(header.AsMemory(), ct);
        content.Position = originalPosition;

        var format = questionType switch
        {
            ObjectiveQuestionTypeCodes.PhotoResponse => ResolvePhotoFormat(header, read),
            ObjectiveQuestionTypeCodes.VoiceResponse => ResolveAudioFormat(header, read),
            _ => null
        };
        if (format is null || !string.Equals(declaredContentType, format.Value.ContentType, StringComparison.OrdinalIgnoreCase))
            throw new ValidationAppException("Attachment bytes and media type do not match the response question.");
        return format.Value;
    }

    private static (string Extension, string ContentType)? ResolvePhotoFormat(byte[] header, int read) =>
        read >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF ? (".jpg", "image/jpeg")
        : read >= 8 && header.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }) ? (".png", "image/png")
        : read >= 12 && header.AsSpan(0, 4).SequenceEqual("RIFF"u8) && header.AsSpan(8, 4).SequenceEqual("WEBP"u8) ? (".webp", "image/webp")
        : null;

    private static (string Extension, string ContentType)? ResolveAudioFormat(byte[] header, int read)
    {
        if (read >= 12 && header.AsSpan(4, 4).SequenceEqual("ftyp"u8)) return (".m4a", "audio/mp4");
        if (read >= 12 && header.AsSpan(0, 4).SequenceEqual("RIFF"u8) && header.AsSpan(8, 4).SequenceEqual("WAVE"u8)) return (".wav", "audio/wav");
        if (read >= 4 && header.AsSpan(0, 4).SequenceEqual(new byte[] { 0x1A, 0x45, 0xDF, 0xA3 })) return (".webm", "audio/webm");
        if (read >= 3 && (header.AsSpan(0, 3).SequenceEqual("ID3"u8) || (header[0] == 0xFF && (header[1] & 0xE0) == 0xE0)))
            return (".mp3", "audio/mpeg");
        return null;
    }
}
