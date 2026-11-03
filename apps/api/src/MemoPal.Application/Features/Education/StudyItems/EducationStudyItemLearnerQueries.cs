using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using MemoPal.Application.Features.Education.Relationships;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.StudyItems;

internal sealed record EducationCourseStudyAccess(bool IsOwner, bool IsPublicLearner, bool IsTeacher,
    bool IsStudent, IReadOnlySet<string> TeacherClassroomIds, IReadOnlySet<string> StudentClassroomIds);

internal static class EducationStudyItemAccess
{
    private static readonly string[] PublicPracticeTypes =
    ["single-choice", "true-false", "fill-blank", "multiple-select", "ordering", "matching"];

    public static async Task<EducationCourseStudyAccess> RequireReadAsync(IAppDbContext db, string userId,
        EducationCourse course, CancellationToken ct)
    {
        if (course.IsModerationHidden || course.IsDeleted) throw new NotFoundAppException("Study content not found.");
        if (course.UserId == userId) return new(true, false, false, false, new HashSet<string>(), new HashSet<string>());
        if (await IsPubliclyDiscoverableAsync(db, course.Id, ct)) return new(false, true, false, false, new HashSet<string>(), new HashSet<string>());

        var classroomIds = await db.EducationAssignments.AsNoTracking()
            .Where(x => x.Scope == EducationAssignmentScopes.Classroom && x.ClassroomId != null && !x.IsDeleted)
            .Join(db.EducationAssessments.AsNoTracking().Where(x => x.CourseId == course.Id && !x.IsDeleted),
                assignment => assignment.AssessmentId, assessment => assessment.Id,
                (assignment, _) => assignment.ClassroomId!)
            .Distinct().ToListAsync(ct);
        var linkedClassroomIds = await db.EducationClassroomCourses.AsNoTracking()
            .Where(link => link.CourseId == course.Id && !link.IsDeleted)
            .Select(link => link.ClassroomId).ToListAsync(ct);
        classroomIds = classroomIds.Concat(linkedClassroomIds).Distinct(StringComparer.Ordinal).ToList();
        var access = new EducationAccess(db);
        var teacher = false;
        var student = false;
        var teacherClassrooms = new HashSet<string>(StringComparer.Ordinal);
        var studentClassrooms = new HashSet<string>(StringComparer.Ordinal);
        foreach (var classroomId in classroomIds)
        {
            var isTeacher = await access.IsActiveClassTeacherAsync(userId, classroomId, ct);
            var isStudent = await access.IsActiveClassStudentAsync(userId, classroomId, ct);
            if (isTeacher) teacherClassrooms.Add(classroomId);
            if (isStudent) studentClassrooms.Add(classroomId);
            teacher |= isTeacher;
            student |= isStudent;
        }
        if (!teacher && !student) throw new NotFoundAppException("Study content not found.");
        return new(false, false, teacher, student, teacherClassrooms, studentClassrooms);
    }

    public static async Task<bool> IsPubliclyDiscoverableAsync(IAppDbContext db, string courseId, CancellationToken ct)
    {
        var courseAvailable = await db.EducationCourses.AsNoTracking().AnyAsync(course => course.Id == courseId &&
            course.IsPublic && !course.IsModerationHidden && !course.IsDeleted && course.PubliclyPublishedAt != null, ct);
        if (!courseAvailable) return false;
        return await db.EducationAssessments.AsNoTracking()
            .Where(assessment => assessment.CourseId == courseId && !assessment.IsDeleted &&
                assessment.Status == EducationAssessmentStatuses.Published && assessment.IsPublicPractice)
            .Join(db.EducationQuestions.AsNoTracking().Where(question => !question.IsDeleted && PublicPracticeTypes.Contains(question.Type)),
                assessment => assessment.Id, question => question.AssessmentId, (_, _) => 1)
            .AnyAsync(ct);
    }

}

public sealed record GetLearnerCourseObjectivesQuery(string UserId, string CourseId)
    : IRequest<ApiResponse<IReadOnlyList<EducationLearnerObjectiveDto>>>;

public sealed class GetLearnerCourseObjectivesHandler(IAppDbContext db)
    : IRequestHandler<GetLearnerCourseObjectivesQuery, ApiResponse<IReadOnlyList<EducationLearnerObjectiveDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<EducationLearnerObjectiveDto>>> Handle(GetLearnerCourseObjectivesQuery q, CancellationToken ct)
    {
        var course = await db.EducationCourses.AsNoTracking().FirstOrDefaultAsync(x => x.Id == q.CourseId && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("Study content not found.");
        var access = await EducationLearnerReadPolicy.RequireReadAsync(db, q.UserId, course, ct);
        var objectives = await db.EducationObjectives.AsNoTracking().Where(x => x.CourseId == course.Id && !x.IsDeleted)
            .OrderBy(x => x.Title).ToListAsync(ct);
        var objectiveIds = objectives.Select(x => x.Id).ToArray();
        var itemCounts = await db.EducationObjectiveStudyItems.AsNoTracking()
            .Where(x => objectiveIds.Contains(x.ObjectiveId) && !x.IsDeleted && x.Status == EducationStudyItemStatus.Published)
            .GroupBy(x => x.ObjectiveId).Select(group => new { Id = group.Key, Count = group.Count() })
            .ToDictionaryAsync(x => x.Id, x => x.Count, ct);
        var assessments = await GetVisibleAssessments(db, q.UserId, course.Id, access, ct);
        var summaries = assessments.Select(x => new EducationLearnerAssessmentSummaryDto(x.Id, x.Title, x.Status, x.Version)).ToArray();
        var assessmentIds = assessments.Select(x => x.Id).ToArray();
        var objectiveAssessmentRows = await db.EducationQuestions.AsNoTracking()
            .Where(question => !question.IsDeleted && objectiveIds.Contains(question.ObjectiveId) && assessmentIds.Contains(question.AssessmentId))
            .Select(question => new { question.ObjectiveId, question.AssessmentId }).Distinct().ToListAsync(ct);
        var objectiveAssessmentMap = objectiveAssessmentRows.GroupBy(x => x.ObjectiveId)
            .ToDictionary(x => x.Key, x => x.Select(item => item.AssessmentId).ToHashSet(StringComparer.Ordinal));
        var result = objectives.Select(objective => new EducationLearnerObjectiveDto(objective.Id, objective.CourseId,
            objective.Title, objective.MemoryContentType.ToString(), objective.LanguageCode, objective.GradeCode,
            objective.CurriculumCode, objective.SubjectCode, objective.ContentOrigin.ToString(), objective.ReviewStatus.ToString(),
            itemCounts.GetValueOrDefault(objective.Id), summaries.Where(a => objectiveAssessmentMap.TryGetValue(objective.Id, out var ids) && ids.Contains(a.Id)).ToArray()))
            .ToArray();
        return ApiResponse<IReadOnlyList<EducationLearnerObjectiveDto>>.Ok(result);
    }

    private static async Task<List<EducationAssessment>> GetVisibleAssessments(IAppDbContext db, string userId,
        string courseId, EducationCourseStudyAccess access, CancellationToken ct)
    {
        var query = db.EducationAssessments.AsNoTracking().Where(x => x.CourseId == courseId && !x.IsDeleted &&
            x.Status == EducationAssessmentStatuses.Published);
        if (access.IsOwner) return await query.OrderBy(x => x.Title).ToListAsync(ct);
        if (access.IsPublicLearner)
            return await query.Where(x => x.IsPublicPractice).OrderBy(x => x.Title).ToListAsync(ct);
        var visibleAssessmentIds = new HashSet<string>(StringComparer.Ordinal);
        var teacherClassroomIds = access.TeacherClassroomIds.ToArray();
        if (teacherClassroomIds.Length > 0)
        {
            var teacherAssessmentIds = await db.EducationAssignments.AsNoTracking()
                .Where(assignment => assignment.Scope == EducationAssignmentScopes.Classroom && assignment.ClassroomId != null &&
                    teacherClassroomIds.Contains(assignment.ClassroomId) && !assignment.IsDeleted)
                .Join(db.EducationAssessments.AsNoTracking().Where(assessment => assessment.CourseId == courseId && !assessment.IsDeleted),
                    assignment => assignment.AssessmentId, assessment => assessment.Id, (_, assessment) => assessment.Id)
                .Distinct().ToArrayAsync(ct);
            visibleAssessmentIds.UnionWith(teacherAssessmentIds);
        }
        var studentClassroomIds = access.StudentClassroomIds.ToArray();
        if (studentClassroomIds.Length > 0)
        {
            var studentAssessmentIds = await db.EducationAssignments.AsNoTracking()
                .Where(assignment => assignment.Scope == EducationAssignmentScopes.Classroom && assignment.ClassroomId != null &&
                    studentClassroomIds.Contains(assignment.ClassroomId) && !assignment.IsDeleted)
                .Join(db.EducationAssessments.AsNoTracking().Where(assessment => assessment.CourseId == courseId && !assessment.IsDeleted),
                assignment => assignment.AssessmentId, assessment => assessment.Id, (assignment, assessment) => assignment.Id)
                .Join(db.EducationAssignmentRecipients.AsNoTracking()
                    .Where(recipient => recipient.StudentUserId == userId && !recipient.IsDeleted),
                    assignmentId => assignmentId, recipient => recipient.AssignmentId, (_, recipient) => recipient.AssessmentId)
                .Distinct().ToArrayAsync(ct);
            visibleAssessmentIds.UnionWith(studentAssessmentIds);
        }
        var assessmentIds = visibleAssessmentIds.ToArray();
        return await query.Where(x => assessmentIds.Contains(x.Id)).OrderBy(x => x.Title).ToListAsync(ct);
    }
}

public sealed record GetLearnerObjectiveStudyItemsQuery(string UserId, string ObjectiveId)
    : IRequest<ApiResponse<IReadOnlyList<EducationLearnerStudyItemDto>>>;

public sealed class GetLearnerObjectiveStudyItemsHandler(IAppDbContext db)
    : IRequestHandler<GetLearnerObjectiveStudyItemsQuery, ApiResponse<IReadOnlyList<EducationLearnerStudyItemDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<EducationLearnerStudyItemDto>>> Handle(GetLearnerObjectiveStudyItemsQuery q, CancellationToken ct)
    {
        var objective = await db.EducationObjectives.AsNoTracking()
            .Include(x => x.Course)
            .FirstOrDefaultAsync(x => x.Id == q.ObjectiveId && !x.IsDeleted && x.Course != null && !x.Course.IsDeleted, ct)
            ?? throw new NotFoundAppException("Study content not found.");
        if (objective.Course!.IsModerationHidden)
        {
            if (objective.Course.UserId != q.UserId) throw new NotFoundAppException("Study content not found.");
        }
        var access = await EducationLearnerReadPolicy.RequireReadAsync(db, q.UserId, objective.Course, ct);
        var rows = await db.EducationObjectiveStudyItems.AsNoTracking()
            .Where(x => x.ObjectiveId == objective.Id && !x.IsDeleted &&
                x.Status == EducationStudyItemStatus.Published)
            .OrderBy(x => x.Position).ToListAsync(ct);
        return ApiResponse<IReadOnlyList<EducationLearnerStudyItemDto>>.Ok(rows.Select(item => new EducationLearnerStudyItemDto(
            item.Id, item.Position, item.Kind.ToString(), item.Primary, item.Secondary, item.Phonetic, item.Extra,
            item.LanguageCode ?? objective.LanguageCode, item.ContentVersion, objective.ReviewStatus.ToString(),
            objective.ContentOrigin.ToString(), EducationStudyIllustrations.FromMediaReference(item.MediaRef))).ToArray());
    }
}
