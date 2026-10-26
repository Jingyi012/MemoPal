using MemoPal.Domain.Common;
using MemoPal.Domain.Education;

namespace MemoPal.Domain.Entities;

public sealed class EducationObjective : AuditableBaseEntity
{
    public string CourseId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? RecommendedMemorySetId { get; set; }
    public EducationMemoryContentType MemoryContentType { get; set; } = EducationMemoryContentType.NotApplicable;
    public string? LanguageCode { get; set; }
    public string? GradeCode { get; set; }
    public string? CurriculumCode { get; set; }
    public string? SubjectCode { get; set; }
    public EducationContentOrigin ContentOrigin { get; set; } = EducationContentOrigin.Original;
    public EducationContentReviewStatus ReviewStatus { get; set; } = EducationContentReviewStatus.Unreviewed;
    public EducationCourse? Course { get; set; }
    public ICollection<EducationObjectiveStudyItem> StudyItems { get; set; } = new List<EducationObjectiveStudyItem>();
}
