using MemoPal.Application.Features.Education.DTOs;

namespace MemoPal.Application.Features.Education.Progress.DTOs;

public sealed record EducationClassroomObjectiveProgressDto(
    string ClassroomId,
    DateTime WindowStart,
    DateTime GeneratedAt,
    IReadOnlyList<EducationStudentObjectiveProgressDto> Students);

public sealed record EducationStudentObjectiveProgressDto(
    string StudentUserId,
    string StudentName,
    IReadOnlyList<EducationObjectiveMasteryDto> Objectives);

public sealed record EducationObjectiveMasteryDto(
    string ObjectiveId,
    string ObjectiveTitle,
    string CourseId,
    string CourseTitle,
    string Status,
    decimal? Score,
    decimal? MaxScore,
    decimal? Percentage,
    int DistinctQuestionCount,
    int DistinctAssessmentCount,
    int DistinctSubmissionDateCount,
    EducationQuestionTypePerformanceDto SelectedResponsePerformance,
    EducationQuestionTypePerformanceDto OpenResponsePerformance,
    IReadOnlyList<EducationObjectiveEvidenceDto> Evidence);

public sealed record EducationObjectiveEvidenceDto(
    string AssessmentId,
    string AssessmentTitle,
    string AssignmentTitle,
    string QuestionId,
    string QuestionPrompt,
    string QuestionType,
    DateTime SubmittedAt,
    decimal Score,
    decimal MaxScore);
