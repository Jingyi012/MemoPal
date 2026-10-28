using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Relationships;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.GuidedLearning;

internal static class EducationClassroomGuidedLearningAccess
{
    public static async Task<EducationCourse> RequireCourseAsync(
        IAppDbContext db, string userId, string classroomId, string courseId, CancellationToken ct)
    {
        var course = await db.EducationCourses.AsNoTracking().FirstOrDefaultAsync(item =>
            item.Id == courseId && !item.IsDeleted && !item.IsModerationHidden, ct)
            ?? throw new NotFoundAppException("Classroom learning content not found.");
        var access = new EducationAccess(db);
        if (!await access.IsActiveClassStudentAsync(userId, classroomId, ct))
            throw new NotFoundAppException("Classroom learning content not found.");
        if (!await access.IsActiveClassTeacherAsync(course.UserId, classroomId, ct))
            throw new NotFoundAppException("Classroom learning content not found.");
        var link = await db.EducationClassroomCourses.AsNoTracking().FirstOrDefaultAsync(link =>
            link.ClassroomId == classroomId && link.CourseId == courseId && !link.IsDeleted && link.GuidedPracticeEnabled, ct);
        if (link is null || link.GuidedPracticeConfirmedByUserId != course.UserId || link.GuidedPracticeConfirmedAtUtc is null)
            throw new NotFoundAppException("Classroom learning content not found.");
        return course;
    }
}
