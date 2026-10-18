namespace MemoPal.Application.Features.Education.Authoring.DTOs;

public sealed record CreateCourseRequest(string Title);
public sealed record CreateObjectiveRequest(string Title, string? RecommendedMemorySetId = null);
public sealed record SetEducationObjectiveMemoryRecommendationRequest(string? RecommendedMemorySetId);
public sealed record CreateAssessmentRequest(string Title);
public sealed record UpdateAssessmentRequest(int ExpectedVersion, string Title, IReadOnlyList<EducationQuestionRequest> Questions);
public sealed record EducationQuestionRequest(
    string? Id, string Prompt, string Type, string? FillMode, decimal MaxScore, string ObjectiveId,
    IReadOnlyList<EducationOptionRequest>? Options = null, string? CorrectOptionId = null,
    bool? CorrectBooleanAnswer = null, IReadOnlyList<string>? AllowedTextAnswers = null,
    bool TrimTextAnswers = false, bool IgnoreCase = false,
    IReadOnlyList<decimal>? AllowedNumericAnswers = null, decimal NumericTolerance = 0,
    IReadOnlyList<string>? CorrectOptionIds = null, IReadOnlyList<string>? CorrectSequenceIds = null,
    IReadOnlyList<EducationMatchingPairRequest>? MatchingPairs = null,
    string? GradingRubric = null,
    string? Explanation = null);
public sealed record EducationOptionRequest(string Id, string Label);
public sealed record EducationMatchingPairRequest(EducationOptionRequest Left, EducationOptionRequest Right);
public sealed record EducationCourseDto(string Id, string Title, DateTime CreatedAt, bool IsPublic = false, DateTime? PubliclyPublishedAt = null);
public sealed record SetEducationCourseVisibilityRequest(bool IsPublic);
public sealed record EducationObjectiveDto(string Id, string CourseId, string Title, DateTime CreatedAt, string? RecommendedMemorySetId = null);
public sealed record EducationAssessmentDto(string Id, string CourseId, string Title, string Status, int Version, DateTime? PublishedAt, IReadOnlyList<EducationQuestionDto> Questions, bool IsPublicPractice = false);
public sealed record EducationQuestionDto(
    string Id, string Prompt, string Type, string? FillMode, decimal MaxScore, string ObjectiveId,
    IReadOnlyList<EducationOptionRequest> Options, string? CorrectOptionId, bool? CorrectBooleanAnswer,
    IReadOnlyList<string> AllowedTextAnswers, bool TrimTextAnswers, bool IgnoreCase,
    IReadOnlyList<decimal> AllowedNumericAnswers, decimal NumericTolerance,
    IReadOnlyList<string> CorrectOptionIds, IReadOnlyList<string> CorrectSequenceIds,
    IReadOnlyList<EducationMatchingPairRequest> MatchingPairs, string? GradingRubric, string? Explanation);
public sealed record EducationStudentQuestionDto(
    string Id, string Prompt, string Type, string? FillMode, decimal MaxScore, string ObjectiveId,
    IReadOnlyList<EducationOptionRequest> Options, int Position,
    IReadOnlyList<EducationOptionRequest> MatchTargets,
    string? Explanation = null);
