using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Relationships;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.StudyItems;

/// <summary>Additional account restriction; the existing EducationAccess methods are unchanged.</summary>
public static class EducationLearnerReadPolicy
{
    public static async Task RequireOwnAttemptAsync(IAppDbContext db, string userId, string attemptId, CancellationToken ct)
    {
        if (!await db.EducationAssessmentAttempts.AsNoTracking().AnyAsync(x => x.Id == attemptId &&
                x.StudentUserId == userId && !x.IsDeleted && x.Recipient != null &&
                !x.Recipient.IsDeleted && x.Recipient.StudentUserId == userId, ct))
            Deny();
    }

    /// <summary>Reject missing and inaccessible sources identically before learner action binding.</summary>
    public static async Task RequireRouteAsync(IAppDbContext db, string userId, string? courseId,
        string? objectiveId, CancellationToken ct)
    {
        if (objectiveId is not null)
            courseId = await db.EducationObjectives.AsNoTracking()
                .Where(x => x.Id == objectiveId && !x.IsDeleted).Select(x => x.CourseId).FirstOrDefaultAsync(ct);
        var course = await db.EducationCourses.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == courseId && !x.IsDeleted, ct);
        if (course is null)
        {
            Deny();
            return;
        }
        _ = await RequireReadAsync(db, userId, course, ct);
    }

    internal static async Task<EducationCourseStudyAccess> RequireReadAsync(IAppDbContext db, string userId,
        EducationCourse course, CancellationToken ct)
    {
        if (!await AccountRestrictions.IsRestrictedAsync(db, userId, ct))
            return await EducationStudyItemAccess.RequireReadAsync(db, userId, course, ct);
        if (course.IsDeleted || course.IsModerationHidden) Deny();
        var assignedClasses = db.EducationAssignments.AsNoTracking()
            .Where(x => !x.IsDeleted && x.Scope == EducationAssignmentScopes.Classroom && x.ClassroomId != null)
            .Join(db.EducationAssessments.Where(a => a.CourseId == course.Id && !a.IsDeleted),
                x => x.AssessmentId, a => a.Id, (x, _) => x.ClassroomId!);
        var classroomIds = await db.EducationClassroomCourses.AsNoTracking()
            .Where(x => x.CourseId == course.Id && !x.IsDeleted).Select(x => x.ClassroomId)
            .Union(assignedClasses).ToArrayAsync(ct);
        var access = new EducationAccess(db);
        var teachers = new HashSet<string>(StringComparer.Ordinal);
        var students = new HashSet<string>(StringComparer.Ordinal);
        foreach (var classroomId in classroomIds)
        {
            if (await access.IsActiveClassTeacherAsync(userId, classroomId, ct)) teachers.Add(classroomId);
            if (await access.IsActiveClassStudentAsync(userId, classroomId, ct)) students.Add(classroomId);
        }
        if (teachers.Count == 0 && students.Count == 0) Deny();
        return new(false, false, teachers.Count > 0, students.Count > 0, teachers, students);
    }

    private static void Deny() => throw new AppException(AccountRestrictions.ForbiddenMessage, 403);
}
