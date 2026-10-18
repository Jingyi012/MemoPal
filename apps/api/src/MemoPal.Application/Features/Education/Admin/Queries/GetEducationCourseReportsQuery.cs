using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Features.Education.Admin.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Admin.Queries;

public sealed record GetEducationCourseReportsQuery(int PageNumber = 1, int PageSize = 20, string Status = "pending")
    : IRequest<PaginatedResponse<EducationCourseReportQueueItemDto>>;

public sealed class GetEducationCourseReportsQueryHandler(IAppDbContext db)
    : IRequestHandler<GetEducationCourseReportsQuery, PaginatedResponse<EducationCourseReportQueueItemDto>>
{
    public async Task<PaginatedResponse<EducationCourseReportQueueItemDto>> Handle(GetEducationCourseReportsQuery query, CancellationToken ct)
    {
        var pageNumber = Math.Max(1, query.PageNumber);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var status = query.Status.Trim().ToLowerInvariant();
        if (status != "all" && !EducationCourseReportStatuses.All.Contains(status))
            throw new ValidationAppException("Select a valid report status.");
        var reportQuery = db.EducationCourseReports.AsNoTracking().Where(x => !x.IsDeleted &&
                db.EducationCourses.Any(course => course.Id == x.CourseId && !course.IsDeleted))
            .Where(x => status == "all" || x.Status == status);
        var grouped = reportQuery
            .GroupBy(x => x.CourseId)
            .Select(group => new { CourseId = group.Key, Count = group.Count(), Latest = group.Max(x => x.CreatedAt) });
        var totalCount = await grouped.CountAsync(ct);
        var page = await grouped.OrderByDescending(x => x.Latest).ThenBy(x => x.CourseId)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        var courseIds = page.Select(x => x.CourseId).ToArray();
        var courses = await db.EducationCourses.AsNoTracking().Where(x => courseIds.Contains(x.Id) && !x.IsDeleted)
            .Select(x => new { x.Id, x.Title, x.UserId, x.IsPublic, x.IsModerationHidden, x.ModerationHiddenReason, x.ModerationHiddenAtUtc })
            .ToListAsync(ct);
        var authorIds = courses.Select(x => x.UserId).Distinct().ToArray();
        var authors = await db.Users.AsNoTracking().Where(x => authorIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x.DisplayName, ct);
        var reports = await reportQuery
            .Where(x => courseIds.Contains(x.CourseId))
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new { x.Id, x.CourseId, x.Reason, x.Details, x.Status, x.ResolutionNote, x.CreatedAt, x.ResolvedAtUtc })
            .ToListAsync(ct);
        var reportsByCourse = reports.GroupBy(x => x.CourseId)
            .ToDictionary(x => x.Key, x => (IReadOnlyList<EducationCourseReportItemDto>)x
                .Select(item => new EducationCourseReportItemDto(item.Id, item.Reason, item.Details, item.Status,
                    item.ResolutionNote, item.CreatedAt, item.ResolvedAtUtc)).ToArray());
        var countByCourse = page.ToDictionary(x => x.CourseId, x => x.Count);
        var data = courses.Where(x => authors.ContainsKey(x.UserId)).Select(course => new EducationCourseReportQueueItemDto(
            course.Id, course.Title, authors[course.UserId], course.IsPublic, course.IsModerationHidden,
            course.ModerationHiddenReason, course.ModerationHiddenAtUtc, countByCourse[course.Id],
            reportsByCourse.GetValueOrDefault(course.Id, []))).ToArray();
        return PaginatedResponse<EducationCourseReportQueueItemDto>.Ok(data, pageNumber, pageSize, totalCount);
    }
}
