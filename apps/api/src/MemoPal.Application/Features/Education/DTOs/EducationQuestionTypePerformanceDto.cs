namespace MemoPal.Application.Features.Education.DTOs;

public sealed record EducationQuestionTypePerformanceDto(
    decimal? Score,
    decimal? MaxScore,
    decimal? Percentage,
    int DistinctQuestionCount,
    int DistinctAssessmentCount,
    int DistinctSubmissionDateCount);
