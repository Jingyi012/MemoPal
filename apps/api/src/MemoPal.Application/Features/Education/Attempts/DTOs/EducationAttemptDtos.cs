using MemoPal.Application.Features.Education.Authoring.DTOs;
using System.Text.Json.Serialization;

namespace MemoPal.Application.Features.Education.Attempts.DTOs;

public sealed record SaveEducationAttemptResponseRequest(
    string QuestionId,
    int ExpectedVersion,
    bool Clear,
    EducationAttemptAnswerInputDto? Answer);

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record EducationAttemptAnswerInputDto(
    string Type,
    string? OptionId = null,
    IReadOnlyList<string>? OptionIds = null,
    IReadOnlyList<string>? OrderedOptionIds = null,
    IReadOnlyList<EducationMatchingAnswerDto>? Matches = null,
    bool? BooleanValue = null,
    string? TextValue = null,
    string? NumericValue = null,
    string? PhotoAttachmentId = null,
    string? AudioAttachmentId = null);

public sealed record EducationAttemptAnswerDto(
    string Type,
    string? OptionId = null,
    IReadOnlyList<string>? OptionIds = null,
    IReadOnlyList<string>? OrderedOptionIds = null,
    IReadOnlyList<EducationMatchingAnswerDto>? Matches = null,
    bool? BooleanValue = null,
    string? TextValue = null,
    string? NumericValue = null,
    string? PhotoAttachmentId = null,
    string? AudioAttachmentId = null);

public sealed record EducationMatchingAnswerDto(string LeftOptionId, string MatchTargetId);

public sealed record EducationAttemptResponseDto(string QuestionId, EducationAttemptAnswerDto? Answer, decimal? Score = null, string? Feedback = null);

public sealed record EducationAssessmentAttemptDto(
    string Id,
    string AssignmentId,
    string Status,
    int Version,
    DateTime StartedAt,
    DateTime ExpiresAt,
    DateTime? SubmittedAt,
    bool ResultPublished,
    DateTime? ResultsPublishedAt,
    decimal? Score,
    decimal? MaxScore,
    IReadOnlyList<EducationStudentQuestionDto> Questions,
    IReadOnlyList<EducationAttemptResponseDto> Responses,
    bool ManualGradingPending = false,
    bool LeaderboardEligible = true);

public sealed record EducationAttemptSubmitDto(
    string AttemptId,
    string Status,
    DateTime? SubmittedAt,
    bool ResultPublished,
    DateTime? ResultsPublishedAt,
    decimal? Score,
    decimal? MaxScore,
    bool ManualGradingPending = false);

public sealed record EducationAttemptSaveDto(string AttemptId, int Version, string Status);

public sealed record EducationPracticeCheckRequest(string QuestionId, EducationAttemptAnswerInputDto? Answer);

public sealed record EducationPracticeCheckDto(string QuestionId, decimal Score, decimal MaxScore, bool IsCorrect,
    string? Explanation = null, EducationAttemptAnswerDto? CorrectAnswer = null);
