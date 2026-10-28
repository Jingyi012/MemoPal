using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class EducationAssessment : AuditableBaseEntity
{
    public string CourseId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Status { get; private set; } = EducationAssessmentStatuses.Draft;
    public bool IsPublicPractice { get; private set; }
    public int Version { get; private set; } = 1;
    public DateTime? PublishedAt { get; private set; }
    public EducationCourse? Course { get; set; }
    public ICollection<EducationQuestion> Questions { get; set; } = new List<EducationQuestion>();

    public void UpdateDraft(string title, IEnumerable<EducationQuestion> questions)
    {
        if (Status != EducationAssessmentStatuses.Draft)
            throw new InvalidOperationException("Published assessments are immutable.");
        Title = title;
        Questions = questions.ToList();
        Version++;
    }

    public void Publish(DateTime publishedAtUtc, bool isPublicPractice = false)
    {
        if (Status != EducationAssessmentStatuses.Draft)
            throw new InvalidOperationException("Only draft assessments can be published.");
        if (Questions.Count is < 1 or > 100)
            throw new ArgumentException("An assessment must contain between 1 and 100 questions.");
        Status = EducationAssessmentStatuses.Published;
        IsPublicPractice = isPublicPractice;
        PublishedAt = DateTime.SpecifyKind(publishedAtUtc, DateTimeKind.Utc);
        Version++;
    }

    public void SetPublicPractice(bool enabled)
    {
        if (Status != EducationAssessmentStatuses.Published)
            throw new InvalidOperationException("Only published assessments can change self-practice visibility.");
        IsPublicPractice = enabled;
    }
}

public static class EducationAssessmentStatuses
{
    public const string Draft = "draft";
    public const string Published = "published";
}
