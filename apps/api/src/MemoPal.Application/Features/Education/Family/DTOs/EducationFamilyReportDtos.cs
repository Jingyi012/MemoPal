using MemoPal.Application.Features.Education.DTOs;

namespace MemoPal.Application.Features.Education.Family.DTOs;

public sealed record EducationFamilyChildDto(string StudentUserId, string StudentName, DateTime LinkedAt);

public sealed record EducationFamilyAssignmentProgressDto(
    string AssignmentId,
    string Title,
    string Scope,
    DateTime OpensAt,
    DateTime DueAt,
    string Status,
    DateTime? StartedAt,
    DateTime? SubmittedAt,
    bool ResultPublished,
    decimal? Score,
    decimal? MaxScore,
    EducationQuestionTypePerformanceDto SelectedResponsePerformance,
    EducationQuestionTypePerformanceDto OpenResponsePerformance);

public sealed record EducationFamilyReportDto(
    string StudentUserId,
    string StudentName,
    int AssignmentCount,
    int NotStartedCount,
    int InProgressCount,
    int SubmittedCount,
    int PublishedResultCount,
    IReadOnlyList<EducationFamilyAssignmentProgressDto> Assignments);
