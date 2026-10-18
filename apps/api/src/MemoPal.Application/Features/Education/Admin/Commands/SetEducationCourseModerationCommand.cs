using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Admin.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Admin.Commands;

public sealed record SetEducationCourseModerationCommand(string CourseId, bool Hidden, string? Reason)
    : IRequest<ApiResponse<EducationCourseReportQueueItemDto>>;

public sealed class SetEducationCourseModerationCommandHandler(IAppDbContext db)
    : IRequestHandler<SetEducationCourseModerationCommand, ApiResponse<EducationCourseReportQueueItemDto>>
{
    public async Task<ApiResponse<EducationCourseReportQueueItemDto>> Handle(SetEducationCourseModerationCommand command, CancellationToken ct)
    {
        var reason = string.IsNullOrWhiteSpace(command.Reason) ? null : command.Reason.Trim();
        if (command.Hidden && reason is null) throw new ValidationAppException("A moderation reason is required.");
        if (reason?.Length > 500) throw new ValidationAppException("Moderation reason cannot exceed 500 characters.");

        var course = await db.EducationCourses.FirstOrDefaultAsync(x => x.Id == command.CourseId && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("Education course not found.");
        course.SetModerationHidden(command.Hidden, reason, DateTime.UtcNow);
        await db.SaveChangesAsync(ct);
        var authorName = await db.Users.AsNoTracking().Where(x => x.Id == course.UserId)
            .Select(x => x.DisplayName).FirstOrDefaultAsync(ct) ?? "Unknown author";
        var reports = await db.EducationCourseReports.AsNoTracking().Where(x => x.CourseId == course.Id && !x.IsDeleted)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new EducationCourseReportItemDto(x.Id, x.Reason, x.Details, x.Status,
                x.ResolutionNote, x.CreatedAt, x.ResolvedAtUtc)).ToListAsync(ct);
        return ApiResponse<EducationCourseReportQueueItemDto>.Ok(new EducationCourseReportQueueItemDto(
            course.Id, course.Title, authorName, course.IsPublic, course.IsModerationHidden,
            course.ModerationHiddenReason, course.ModerationHiddenAtUtc, reports.Count, reports));
    }
}
