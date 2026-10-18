using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.PublicLearning.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.PublicLearning.Commands;

public sealed record ReportEducationCourseCommand(string UserId, string CourseId, ReportEducationCourseRequest Request)
    : IRequest<ApiResponse<EducationCourseReportDto>>;

public sealed class ReportEducationCourseCommandHandler(IAppDbContext db)
    : IRequestHandler<ReportEducationCourseCommand, ApiResponse<EducationCourseReportDto>>
{
    private static readonly HashSet<string> Reasons = new(StringComparer.Ordinal)
    { "incorrect", "inappropriate", "personal-info", "copyright", "spam", "other" };

    public async Task<ApiResponse<EducationCourseReportDto>> Handle(ReportEducationCourseCommand command, CancellationToken ct)
    {
        var reason = command.Request.Reason.Trim().ToLowerInvariant();
        var details = string.IsNullOrWhiteSpace(command.Request.Details) ? null : command.Request.Details.Trim();
        if (!Reasons.Contains(reason)) throw new ValidationAppException("Select a valid report reason.");
        if (details?.Length > 500) throw new ValidationAppException("Report details cannot exceed 500 characters.");

        var course = await db.EducationCourses.AsNoTracking().FirstOrDefaultAsync(x =>
            x.Id == command.CourseId && !x.IsDeleted && x.IsPublic && !x.IsModerationHidden && x.PubliclyPublishedAt != null, ct)
            ?? throw new NotFoundAppException("Public course not found.");
        if (course.UserId == command.UserId) throw new ValidationAppException("You cannot report your own course.");

        var report = await db.EducationCourseReports.FirstOrDefaultAsync(x =>
            x.UserId == command.UserId && x.CourseId == course.Id, ct);
        if (report is null)
        {
            report = new EducationCourseReport { UserId = command.UserId, CourseId = course.Id };
            await db.EducationCourseReports.AddAsync(report, ct);
        }
        else if (report.IsDeleted)
        {
            report.IsDeleted = false;
            report.DeletedAt = null;
            report.DeletedBy = null;
        }
        report.Reason = reason;
        report.Details = details;
        report.Status = EducationCourseReportStatuses.Pending;
        report.ResolutionNote = null;
        report.ResolvedAtUtc = null;
        report.ResolvedByUserId = null;
        await db.SaveChangesAsync(ct);
        return ApiResponse<EducationCourseReportDto>.Ok(new(report.Id, course.Id, reason, report.Status, report.CreatedAt));
    }
}
