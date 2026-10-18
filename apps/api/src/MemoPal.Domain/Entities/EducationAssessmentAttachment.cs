using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class EducationAssessmentAttachment : AuditableBaseEntity
{
    public string AttemptId { get; set; } = string.Empty;
    public string QuestionId { get; set; } = string.Empty;
    public string UploadedByUserId { get; set; } = string.Empty;
    public string StorageKey { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long Length { get; set; }
}
