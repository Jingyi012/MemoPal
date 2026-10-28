using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Authoring;
using MemoPal.Application.Features.Education.Relationships;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.StudyItems;

public sealed record EducationClassroomCourseObjectiveSummaryDto(string Id, string Title, string MemoryContentType,
    string? LanguageCode, int PublishedStudyItemCount);
public sealed record EducationClassroomCourseSummaryDto(string ClassroomId, string CourseId, string Title,
    DateTime AttachedAtUtc, IReadOnlyList<EducationClassroomCourseObjectiveSummaryDto> Objectives,
    bool GuidedPracticeEnabled, bool CanManageGuidedPractice);
public sealed record SetClassroomGuidedPracticeRequest(bool Enabled, bool NotConfidentialExamContent = false);
public sealed record EducationCourseClassroomDto(string ClassroomId, string ClassroomName, DateTime AttachedAtUtc);

public sealed record AttachEducationCourseToClassroomCommand(string UserId, string ClassroomId, string CourseId)
    : IRequest<ApiResponse<EducationClassroomCourseSummaryDto>>;

public sealed class AttachEducationCourseToClassroomHandler(IAppDbContext db)
    : IRequestHandler<AttachEducationCourseToClassroomCommand, ApiResponse<EducationClassroomCourseSummaryDto>>
{
    public async Task<ApiResponse<EducationClassroomCourseSummaryDto>> Handle(AttachEducationCourseToClassroomCommand q, CancellationToken ct)
    {
        await AuthoringValidation.OwnedCourse(db, q.UserId, q.CourseId, ct);
        if (!await new EducationAccess(db).IsActiveClassTeacherAsync(q.UserId, q.ClassroomId, ct))
            throw new NotFoundAppException("Classroom course not found.");

        var link = await db.EducationClassroomCourses.IgnoreQueryFilters()
            .FirstOrDefaultAsync(x => x.ClassroomId == q.ClassroomId && x.CourseId == q.CourseId, ct);
        if (link is null)
        {
            link = new EducationClassroomCourse
            {
                Id = Guid.NewGuid().ToString("N"), ClassroomId = q.ClassroomId, CourseId = q.CourseId,
                AttachedByUserId = q.UserId, AttachedAtUtc = DateTime.UtcNow
            };
            db.EducationClassroomCourses.Add(link);
        }
        else if (link.IsDeleted)
        {
            link.IsDeleted = false;
            link.AttachedByUserId = q.UserId;
            link.AttachedAtUtc = DateTime.UtcNow;
            link.GuidedPracticeEnabled = false;
            link.GuidedPracticeConfirmedByUserId = null;
            link.GuidedPracticeConfirmedAtUtc = null;
        }
        await db.SaveChangesAsync(ct);
        return ApiResponse<EducationClassroomCourseSummaryDto>.Ok(await EducationClassroomCourseQueries.Summary(db, link, q.UserId, ct));
    }
}

public sealed record DetachEducationCourseFromClassroomCommand(string UserId, string ClassroomId, string CourseId)
    : IRequest<ApiResponse<bool>>;

public sealed class DetachEducationCourseFromClassroomHandler(IAppDbContext db)
    : IRequestHandler<DetachEducationCourseFromClassroomCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(DetachEducationCourseFromClassroomCommand q, CancellationToken ct)
    {
        await AuthoringValidation.OwnedCourse(db, q.UserId, q.CourseId, ct);
        if (!await new EducationAccess(db).IsActiveClassTeacherAsync(q.UserId, q.ClassroomId, ct))
            throw new NotFoundAppException("Classroom course not found.");
        var link = await db.EducationClassroomCourses.FirstOrDefaultAsync(x => x.ClassroomId == q.ClassroomId &&
            x.CourseId == q.CourseId && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("Classroom course not found.");
        link.IsDeleted = true;
        await db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}

public sealed record GetEducationClassroomCoursesQuery(string UserId, string ClassroomId)
    : IRequest<ApiResponse<IReadOnlyList<EducationClassroomCourseSummaryDto>>>;

public sealed class GetEducationClassroomCoursesHandler(IAppDbContext db)
    : IRequestHandler<GetEducationClassroomCoursesQuery, ApiResponse<IReadOnlyList<EducationClassroomCourseSummaryDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<EducationClassroomCourseSummaryDto>>> Handle(GetEducationClassroomCoursesQuery q, CancellationToken ct)
    {
        var access = new EducationAccess(db);
        if (!await access.IsActiveClassTeacherAsync(q.UserId, q.ClassroomId, ct) &&
            !await access.IsActiveClassStudentAsync(q.UserId, q.ClassroomId, ct))
            throw new NotFoundAppException("Classroom not found.");
        var links = await db.EducationClassroomCourses.AsNoTracking()
            .Where(x => x.ClassroomId == q.ClassroomId && !x.IsDeleted)
            .Join(db.EducationCourses.AsNoTracking().Where(course => !course.IsDeleted && !course.IsModerationHidden),
                link => link.CourseId, course => course.Id, (link, _) => link)
            .OrderBy(x => x.AttachedAtUtc).ToListAsync(ct);
        var results = new List<EducationClassroomCourseSummaryDto>(links.Count);
        foreach (var link in links) results.Add(await EducationClassroomCourseQueries.Summary(db, link, q.UserId, ct));
        return ApiResponse<IReadOnlyList<EducationClassroomCourseSummaryDto>>.Ok(results);
    }
}

public sealed record GetEducationCourseClassroomsQuery(string UserId, string CourseId, bool IsAdmin = false)
    : IRequest<ApiResponse<IReadOnlyList<EducationCourseClassroomDto>>>;

public sealed class GetEducationCourseClassroomsHandler(IAppDbContext db)
    : IRequestHandler<GetEducationCourseClassroomsQuery, ApiResponse<IReadOnlyList<EducationCourseClassroomDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<EducationCourseClassroomDto>>> Handle(GetEducationCourseClassroomsQuery q, CancellationToken ct)
    {
        await AuthoringValidation.OwnedCourse(db, q.UserId, q.CourseId, ct, q.IsAdmin);
        var result = await db.EducationClassroomCourses.AsNoTracking()
            .Where(x => x.CourseId == q.CourseId && !x.IsDeleted)
            .Join(db.EducationClassrooms.AsNoTracking().Where(x => !x.IsDeleted), x => x.ClassroomId, y => y.Id,
                (link, classroom) => new { Classroom = classroom, Link = link })
            .OrderBy(x => x.Classroom.Name)
            .Select(x => new EducationCourseClassroomDto(x.Classroom.Id, x.Classroom.Name, x.Link.AttachedAtUtc))
            .ToListAsync(ct);
        return ApiResponse<IReadOnlyList<EducationCourseClassroomDto>>.Ok(result);
    }
}

internal static class EducationClassroomCourseQueries
{
    public static async Task<EducationClassroomCourseSummaryDto> Summary(IAppDbContext db,
        EducationClassroomCourse link, string userId, CancellationToken ct)
    {
        var course = await db.EducationCourses.AsNoTracking().SingleAsync(x => x.Id == link.CourseId, ct);
        var canManage = course.UserId == userId && !await AccountRestrictions.IsRestrictedAsync(db, userId, ct) &&
            await new EducationAccess(db).IsActiveClassTeacherAsync(userId, link.ClassroomId, ct);
        var objectives = await db.EducationObjectives.AsNoTracking()
            .Where(x => x.CourseId == link.CourseId && !x.IsDeleted)
            .OrderBy(x => x.Title).Select(x => new
            {
                x.Id, x.Title, x.MemoryContentType, x.LanguageCode,
                Count = db.EducationObjectiveStudyItems.Count(item => item.ObjectiveId == x.Id &&
                    !item.IsDeleted && item.Status == EducationStudyItemStatus.Published)
            }).ToListAsync(ct);
        var summaries = objectives.Select(x => new EducationClassroomCourseObjectiveSummaryDto(
            x.Id, x.Title, x.MemoryContentType.ToString(), x.LanguageCode, x.Count)).ToArray();
        return new(link.ClassroomId, link.CourseId, course.Title, link.AttachedAtUtc, summaries,
            link.GuidedPracticeEnabled, canManage);
    }
}

public sealed record SetClassroomGuidedPracticeCommand(string UserId, string ClassroomId, string CourseId,
    SetClassroomGuidedPracticeRequest Request) : IRequest<ApiResponse<EducationClassroomCourseSummaryDto>>;

public sealed class SetClassroomGuidedPracticeHandler(IAppDbContext db)
    : IRequestHandler<SetClassroomGuidedPracticeCommand, ApiResponse<EducationClassroomCourseSummaryDto>>
{
    public async Task<ApiResponse<EducationClassroomCourseSummaryDto>> Handle(SetClassroomGuidedPracticeCommand q, CancellationToken ct)
    {
        await AuthoringValidation.OwnedCourse(db, q.UserId, q.CourseId, ct);
        if (!await new EducationAccess(db).IsActiveClassTeacherAsync(q.UserId, q.ClassroomId, ct))
            throw new NotFoundAppException("Classroom course not found.");
        var link = await db.EducationClassroomCourses.FirstOrDefaultAsync(x => x.ClassroomId == q.ClassroomId &&
            x.CourseId == q.CourseId && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("Classroom course not found.");
        if (q.Request.Enabled && !q.Request.NotConfidentialExamContent)
            throw new MemoPal.Application.Common.Exceptions.ValidationAppException(
                "Confirm that this linked course is safe for guided practice.");
        link.GuidedPracticeEnabled = q.Request.Enabled;
        if (q.Request.Enabled)
        {
            link.GuidedPracticeConfirmedByUserId = q.UserId;
            link.GuidedPracticeConfirmedAtUtc = DateTime.UtcNow;
        }
        await db.SaveChangesAsync(ct);
        return ApiResponse<EducationClassroomCourseSummaryDto>.Ok(
            await EducationClassroomCourseQueries.Summary(db, link, q.UserId, ct));
    }
}
