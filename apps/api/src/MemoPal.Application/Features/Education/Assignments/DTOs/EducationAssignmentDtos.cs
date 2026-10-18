namespace MemoPal.Application.Features.Education.Assignments.DTOs;

public sealed record CreateClassroomAssignmentRequest(
    string AssessmentId,
    string Title,
    DateTime OpensAt,
    DateTime DueAt,
    int? TimeLimitMinutes,
    string IdempotencyKey,
    IReadOnlyList<string> StudentUserIds,
    bool EnableStudentLeaderboard = false);

public sealed record CreateFamilyAssignmentRequest(
    string AssessmentId,
    string Title,
    DateTime OpensAt,
    DateTime DueAt,
    int? TimeLimitMinutes,
    string IdempotencyKey,
    IReadOnlyList<string> StudentUserIds);

public sealed record CreateEducationRetakeRequest(
    string StudentUserId,
    string Reason,
    DateTime OpensAt,
    DateTime DueAt,
    int? TimeLimitMinutes,
    string IdempotencyKey);

public sealed record EducationAssignmentDto(
    string Id,
    string Scope,
    string? ClassroomId,
    string AssessmentId,
    int AssessmentVersion,
    string Title,
    DateTime OpensAt,
    DateTime DueAt,
    int? TimeLimitMinutes,
    DateTime CreatedAt,
    DateTime? ResultsPublishedAt,
    bool StudentLeaderboardEnabled,
    IReadOnlyList<EducationAssignmentRecipientDto> Recipients,
    string? RetakeOfAssignmentId = null,
    string? RetakeReason = null);

public sealed record EducationAssignmentGradebookDto(
    string AssignmentId,
    string Title,
    DateTime? ResultsPublishedAt,
    IReadOnlyList<EducationAssignmentGradeRowDto> Students);

public sealed record EducationAssignmentLeaderboardDto(
    string AssignmentId,
    string Title,
    DateTime ResultsPublishedAt,
    int AssignedParticipantCount,
    int RankedParticipantCount,
    int? MyRank,
    decimal? MyScore,
    decimal? MaxScore,
    bool FullLeaderboardEnabled,
    IReadOnlyList<EducationAssignmentLeaderboardRowDto> VisibleEntries);

public sealed record EducationAssignmentLeaderboardRowDto(int Rank, string Alias, decimal Score, decimal MaxScore, bool IsMe);

public sealed record EducationAssignmentGradeRowDto(
    string RecipientId,
    string StudentUserId,
    string StudentName,
    string Status,
    DateTime? StartedAt,
    DateTime? SubmittedAt,
    decimal? Score,
    decimal? MaxScore,
    int GradeRevisionCount,
    string? AttemptId,
    IReadOnlyList<EducationGradeRevisionDto> GradeRevisions,
    IReadOnlyList<EducationManualResponseGradeDto> ManualResponses);

public sealed record EducationManualResponseGradeDto(
    string QuestionId, string Prompt, string Rubric, string? Answer, string? PhotoAttachmentId, string? AudioAttachmentId, decimal MaxScore,
    decimal? Score, string? Feedback, string? GradedByUserId, DateTime? GradedAt);

public sealed record GradeEducationManualResponseRequest(decimal Score, string? Feedback);
public sealed record GradeEducationManualResponseDto(
    string AssignmentId, string AttemptId, string QuestionId, decimal? AttemptScore, decimal MaxScore, bool AttemptFullyGraded);

public sealed record EducationGradeRevisionDto(
    string CorrectedByUserId, decimal PreviousScore, decimal NewScore,
    decimal MaxScore, string Reason, DateTime CorrectedAt);

public sealed record PublishEducationAssignmentResultsDto(string AssignmentId, DateTime ResultsPublishedAt);

public sealed record CorrectEducationAttemptGradeDto(
    string AssignmentId, string AttemptId, string RevisionId, decimal Score, decimal MaxScore,
    DateTime? ResultsPublishedAt, DateTime CorrectedAt);

public sealed record EducationAssignmentRecipientDto(
    string Id,
    string StudentUserId,
    string AssessmentId,
    int AssessmentVersion,
    string Title,
    DateTime OpensAt,
    DateTime DueAt,
    int? TimeLimitMinutes,
    bool IncludeInStudentLeaderboard);

public sealed record MyEducationAssignmentDto(
    string Id,
    string AssessmentId,
    int AssessmentVersion,
    string? CourseId,
    string? CourseTitle,
    string Title,
    DateTime OpensAt,
    DateTime DueAt,
    int? TimeLimitMinutes,
    string Scope,
    string? ClassroomId,
    bool StudentLeaderboardEnabled,
    bool IncludeInStudentLeaderboard,
    DateTime? ResultsPublishedAt);

public sealed record UpdateEducationLeaderboardPreferenceRequest(bool IncludeInLeaderboard);
