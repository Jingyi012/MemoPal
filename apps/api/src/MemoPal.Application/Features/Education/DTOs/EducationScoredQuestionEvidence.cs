namespace MemoPal.Application.Features.Education.DTOs;

public sealed record EducationScoredQuestionEvidence(
    string AssessmentId,
    string QuestionId,
    string QuestionType,
    DateTime SubmittedAt,
    decimal Score,
    decimal MaxScore);
