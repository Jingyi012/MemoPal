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
public sealed record SetEducationCourseVisibilityRequest(bool IsPublic, bool NotConfidentialExamContent = false);
public sealed record EducationObjectiveDto(string Id, string CourseId, string Title, DateTime CreatedAt, string? RecommendedMemorySetId = null,
    string MemoryContentType = "NotApplicable", string? LanguageCode = null, string? GradeCode = null,
    string? CurriculumCode = null, string? SubjectCode = null, string ContentOrigin = "Original", string ReviewStatus = "Unreviewed");
public sealed record UpdateEducationObjectiveStudyMetadataRequest(string MemoryContentType, string? LanguageCode,
    string? GradeCode, string? CurriculumCode, string? SubjectCode, string ContentOrigin, string ReviewStatus);
public sealed record EducationObjectiveStudyItemRequest(string? StableKey, int Position, string Kind, string Primary,
    string? Secondary = null, string? Phonetic = null, string? Extra = null, string? Hint = null,
    string? MediaRef = null, string? LanguageCode = null);
public sealed record ReorderEducationStudyItemsRequest(IReadOnlyList<string> ItemIds);
public sealed record PublishEducationStudyItemRequest(bool NotConfidentialExamContent = false);
public sealed record EducationObjectiveStudyItemAuthorDto(string Id, string ObjectiveId, string StableKey,
    int Position, string Kind, string Primary, string? Secondary, string? Phonetic, string? Extra, string? Hint,
    string? MediaRef, string? LanguageCode, string Status, int ContentVersion,
    string? NotConfidentialExamContentConfirmedByUserId, DateTime? NotConfidentialExamContentConfirmedAtUtc,
    DateTime CreatedAtUtc, DateTime UpdatedAtUtc);
public sealed record EducationStudyItemImportError(int Row, string Field, string ReasonCode, string Message)
{
    public EducationStudyItemImportError(int row, string field, string message)
        : this(row, field, EducationStudyItemImportErrorCodes.For(field, message), message) { }
}

public static class EducationStudyItemImportErrorCodes
{
    public static string For(string field, string message)
    {
        field = field.ToLowerInvariant();
        if (message.Contains("UTF-8", StringComparison.OrdinalIgnoreCase)) return "InvalidEncoding";
        if (message.Contains("Unicode code points", StringComparison.OrdinalIgnoreCase)) return "FieldTooLong";
        if (message.Contains("control or zero-width", StringComparison.OrdinalIgnoreCase)) return "InvalidCharacters";
        if (message.Contains("GradeCode", StringComparison.OrdinalIgnoreCase)) return "InvalidGradeCode";
        if (message.Contains("MediaRef", StringComparison.OrdinalIgnoreCase)) return "InvalidMediaRef";
        if (message.Contains("exceeds", StringComparison.OrdinalIgnoreCase) || message.Contains("limit", StringComparison.OrdinalIgnoreCase)) return field == "file" ? "FileTooLarge" : "ItemsLimitExceeded";
        if (message.Contains("required", StringComparison.OrdinalIgnoreCase) || message.Contains("必需", StringComparison.Ordinal)) return "RequiredField";
        if (message.Contains("Duplicate", StringComparison.OrdinalIgnoreCase) || message.Contains("unique", StringComparison.OrdinalIgnoreCase)) return "DuplicateValue";
        if (message.Contains("Published", StringComparison.OrdinalIgnoreCase)) return "PublishedItemConflict";
        if (field == "position") return "InvalidPosition";
        if (field == "kind") return "InvalidKind";
        if (field == "language") return "InvalidLanguage";
        if (field == "csv" || field == "header") return "InvalidCsv";
        if (field == "row") return "InvalidRow";
        if (field == "items") return "ItemsLimitExceeded";
        return "InvalidField";
    }
}
public sealed record EducationStudyItemImportResult(bool Imported, int Created, int Updated,
    IReadOnlyList<EducationStudyItemImportError> Errors, int Unchanged = 0, int RejectedRows = 0, bool CanImport = true)
{
    public const int MaxImportBytes = 1024 * 1024;
    public static EducationStudyItemImportResult Rejected(IReadOnlyList<EducationStudyItemImportError> errors) =>
        new(false, 0, 0, errors, 0, Math.Max(1, errors.Select(x => x.Row).Distinct().Count()), false);
}
public sealed record EducationLearnerObjectiveDto(string Id, string CourseId, string Title,
    string MemoryContentType, string? LanguageCode, string? GradeCode, string? CurriculumCode,
    string? SubjectCode, string ContentOrigin, string ReviewStatus, int PublishedStudyItemCount,
    IReadOnlyList<EducationLearnerAssessmentSummaryDto> Assessments);
public sealed record EducationLearnerAssessmentSummaryDto(string Id, string Title, string Status, int Version);
public sealed record EducationLearnerStudyItemDto(string Id, int Position, string Kind, string Primary,
    string? Secondary, string? Phonetic, string? Extra, string? LanguageCode, int ContentVersion,
    string ReviewStatus, string ContentOrigin);
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
