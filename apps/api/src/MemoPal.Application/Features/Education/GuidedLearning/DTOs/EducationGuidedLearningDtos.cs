using System.Text.Json.Serialization;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using MemoPal.Application.Features.Education.Attempts.DTOs;

namespace MemoPal.Application.Features.Education.GuidedLearning.DTOs;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record EducationGuidedLearningCheckRequest(
    string RequestId,
    int ExpectedVersion,
    EducationAttemptAnswerInputDto Answer);

public sealed record EducationGuidedLearningQuestionProgressDto(
    string QuestionId,
    int Position,
    int AttemptCount,
    bool? FirstTryCorrect,
    bool Missed,
    bool Solved,
    bool? LatestCorrect);

public sealed record EducationGuidedLearningQuestionDto(
    EducationStudentQuestionDto Question,
    string ObjectiveTitle,
    EducationGuidedLearningQuestionProgressDto Progress);

public sealed record EducationGuidedLearningSessionDto(
    string SessionId,
    string CourseId,
    string CourseTitle,
    string AssessmentId,
    string AssessmentTitle,
    int AssessmentVersion,
    int Version,
    DateTime StartedAtUtc,
    DateTime? CompletedAtUtc,
    bool IsComplete,
    IReadOnlyList<EducationGuidedLearningQuestionDto> Questions,
    string? NextQuestionId);

public sealed record EducationGuidedLearningCheckDto(
    string SessionId,
    string QuestionId,
    bool IsCorrect,
    string? Explanation,
    int SessionVersion,
    bool IsComplete,
    EducationGuidedLearningQuestionProgressDto Progress,
    string? NextQuestionId,
    bool Replayed,
    EducationAttemptAnswerDto? CorrectAnswer = null);

public sealed record EducationGuidedLessonProgressDto(
    string AssessmentId,
    string AssessmentTitle,
    IReadOnlyList<EducationGuidedObjectiveSummaryDto> Objectives,
    int AssessmentVersion,
    int QuestionCount,
    int QuestionsAttempted,
    int QuestionsSolved,
    int NeverSolvedQuestionCount,
    int LatestIncorrectQuestionCount,
    bool IsStarted,
    bool IsComplete,
    string? SessionId,
    int? SessionVersion,
    DateTime? CompletedAtUtc);

public sealed record EducationGuidedObjectiveSummaryDto(string ObjectiveId, string ObjectiveTitle);

public sealed record EducationGuidedCourseProgressDto(
    string CourseId,
    string CourseTitle,
    IReadOnlyList<EducationGuidedLessonProgressDto> Lessons,
    int CompletedLessonCount,
    string? NextRecommendedAssessmentId);
