using MemoPal.Domain.Common;
using MemoPal.Domain.Education;

namespace MemoPal.Domain.Entities;

public sealed class EducationObjectiveStudyItem : AuditableBaseEntity
{
    public string ObjectiveId { get; set; } = string.Empty;
    public string StableKey { get; set; } = string.Empty;
    public int Position { get; set; }
    public EducationMemoryContentType Kind { get; set; }
    public string Primary { get; set; } = string.Empty;
    public string? Secondary { get; set; }
    public string? Phonetic { get; set; }
    public string? Extra { get; set; }
    public string? Hint { get; set; }
    public string? MediaRef { get; set; }
    public string? LanguageCode { get; set; }
    public EducationStudyItemStatus Status { get; set; } = EducationStudyItemStatus.Draft;
    public int ContentVersion { get; set; } = 1;
    public string? NotConfidentialExamContentConfirmedByUserId { get; set; }
    public DateTime? NotConfidentialExamContentConfirmedAtUtc { get; set; }
    public EducationObjective? Objective { get; set; }

    public void UpdateContent(int position, EducationMemoryContentType kind, string primary, string? secondary,
        string? phonetic, string? extra, string? hint, string? mediaRef, string? languageCode)
    {
        Position = position;
        Kind = kind;
        Primary = primary;
        Secondary = secondary;
        Phonetic = phonetic;
        Extra = extra;
        Hint = hint;
        MediaRef = mediaRef;
        LanguageCode = languageCode;
        ContentVersion++;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetPublished(bool published, string? confirmedByUserId, DateTime nowUtc)
    {
        Status = published ? EducationStudyItemStatus.Published : EducationStudyItemStatus.Draft;
        if (published && confirmedByUserId is not null)
        {
            NotConfidentialExamContentConfirmedByUserId = confirmedByUserId;
            NotConfidentialExamContentConfirmedAtUtc = DateTime.SpecifyKind(nowUtc, DateTimeKind.Utc);
        }
        ContentVersion++;
        UpdatedAt = DateTime.UtcNow;
    }
}
