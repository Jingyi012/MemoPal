using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public static class EducationCourseReportStatuses
{
    public const string Pending = "pending";
    public const string Resolved = "resolved";
    public const string Dismissed = "dismissed";
    public static readonly string[] All = [Pending, Resolved, Dismissed];
}

public sealed class EducationCourseReport : UserOwnedEntity
{
    public string CourseId { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string? Details { get; set; }
    public string Status { get; set; } = EducationCourseReportStatuses.Pending;
    public string? ResolutionNote { get; set; }
    public DateTime? ResolvedAtUtc { get; set; }
    public string? ResolvedByUserId { get; set; }
}
