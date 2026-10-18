using MemoPal.Application.Features.Education.Attempts.DTOs;
using MemoPal.Application.Features.Education.Authoring.DTOs;

namespace MemoPal.Application.Features.Education.PublicLearning.DTOs;

public sealed record EducationPublicCourseSummaryDto(
    string Id, string Title, string AuthorDisplayName, DateTime PublishedAt, int AssessmentCount, int QuestionCount,
    bool IsSaved = false);

public sealed record EducationPublicAssessmentSummaryDto(
    string Id, string Title, DateTime PublishedAt, int QuestionCount, IReadOnlyList<string> QuestionTypes);

public sealed record EducationPublicCourseDetailDto(
    string Id, string Title, string AuthorDisplayName, DateTime PublishedAt,
    IReadOnlyList<EducationPublicAssessmentSummaryDto> Assessments,
    IReadOnlyList<EducationPublicObjectiveDto> Objectives,
    bool IsSaved = false);

public sealed record EducationPublicCourseSaveDto(string CourseId, bool IsSaved);

public sealed record ReportEducationCourseRequest(string Reason, string? Details = null);

public sealed record EducationCourseReportDto(string Id, string CourseId, string Reason, string Status, DateTime CreatedAt);

public sealed record EducationPublicObjectiveDto(
    string Id, string Title, EducationRecommendedMemorySetDto? RecommendedMemorySet);

public sealed record EducationRecommendedMemorySetDto(
    string Id, string Title, string GoalType, string TechniqueKey, string? Description);

public sealed record EducationPublicPracticeQuestionDto(EducationStudentQuestionDto Question, string ObjectiveTitle);

public sealed record EducationPublicPracticeAssessmentDto(
    string Id, string CourseId, string Title, DateTime PublishedAt,
    IReadOnlyList<EducationPublicPracticeQuestionDto> Questions);

public sealed record EducationPublicPracticeAnswerRequest(string AssessmentId, string QuestionId, EducationAttemptAnswerInputDto? Answer);

public sealed record EducationPublicPracticeAnswerDto(string QuestionId, bool IsCorrect, string? Explanation);

public sealed record EducationPublicPracticeHistoryItemDto(
    string CourseId, string CourseTitle, string AssessmentId, string AssessmentTitle,
    string QuestionId, string QuestionPrompt, string ObjectiveTitle, bool LastAnswerCorrect, DateTime LastAnsweredAtUtc);
