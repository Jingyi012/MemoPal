namespace MemoPal.Application.Features.Education.Admin.DTOs;

public sealed record EducationCourseReportItemDto(
    string Id, string Reason, string? Details, string Status, string? ResolutionNote, DateTime CreatedAt,
    DateTime? ResolvedAtUtc);

public sealed record EducationCourseReportQueueItemDto(
    string CourseId, string Title, string AuthorDisplayName, bool IsPublic, bool IsModerationHidden,
    string? ModerationHiddenReason, DateTime? ModerationHiddenAtUtc, int ReportCount,
    IReadOnlyList<EducationCourseReportItemDto> Reports);

public sealed record ModerateEducationCourseRequest(string? Reason);

public sealed record ModerateEducationCourseReportRequest(string Status, string Note);
