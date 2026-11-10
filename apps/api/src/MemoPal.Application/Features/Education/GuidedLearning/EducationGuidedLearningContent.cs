using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Attempts;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.GuidedLearning;

internal sealed record EducationGuidedLearningContent(
    EducationCourse Course,
    EducationAssessment Assessment,
    IReadOnlyList<EducationQuestion> Questions,
    IReadOnlyDictionary<string, string> ObjectiveTitles);

internal static class EducationGuidedLearningContentReader
{
    public static async Task<EducationGuidedLearningContent> ReadLessonAsync(
        IAppDbContext db, string userId, string courseId, string assessmentId, CancellationToken ct,
        string? classroomId = null)
    {
        var course = await ReadCourseAsync(db, userId, courseId, classroomId, ct);
        var assessment = await db.EducationAssessments.AsNoTracking().Include(item => item.Questions)
            .FirstOrDefaultAsync(item => item.Id == assessmentId && item.CourseId == course.Id &&
                !item.IsDeleted && item.Status == EducationAssessmentStatuses.Published && (item.IsPublicPractice || course.UserId == userId), ct)
            ?? throw new NotFoundAppException("Public guided lesson not found.");

        var candidates = assessment.Questions
            .Where(question => !question.IsDeleted && EducationPracticeQuestionTypes.IsSupported(question.Type))
            .OrderBy(question => question.Position).ThenBy(question => question.Id, StringComparer.Ordinal)
            .ToArray();
        var objectiveIds = candidates.Select(question => question.ObjectiveId).Distinct().ToArray();
        var objectives = await db.EducationObjectives.AsNoTracking()
            .Where(objective => objectiveIds.Contains(objective.Id) && objective.CourseId == course.Id && !objective.IsDeleted)
            .ToDictionaryAsync(objective => objective.Id, objective => objective.Title, ct);
        var questions = candidates.Where(question => objectives.ContainsKey(question.ObjectiveId)).ToArray();
        if (questions.Length == 0)
            throw new NotFoundAppException("Public guided lesson not found.");

        return new(course, assessment, questions, objectives);
    }

    public static async Task<EducationCourse> ReadCourseAsync(IAppDbContext db, string userId, string courseId,
        string? classroomId, CancellationToken ct)
    {
        if (classroomId is not null)
            return await EducationClassroomGuidedLearningAccess.RequireCourseAsync(db, userId, classroomId, courseId, ct);
        return await db.EducationCourses.AsNoTracking().FirstOrDefaultAsync(item =>
            item.Id == courseId && !item.IsModerationHidden && !item.IsDeleted && ((item.IsPublic && item.PubliclyPublishedAt != null) || item.UserId == userId), ct)
            ?? throw new NotFoundAppException("Public course not found.");
    }

    public static IReadOnlyList<string> ReadQuestionOrder(EducationGuidedLearningSession session)
    {
        return session.Questions.Where(item => !item.IsDeleted).OrderBy(item => item.Position)
            .Select(item => item.QuestionId).ToArray();
    }

    public static void ValidateSessionContent(EducationGuidedLearningSession session, EducationGuidedLearningContent content)
    {
        var order = ReadQuestionOrder(session);
        var sourceIds = content.Questions.Select(question => question.Id).ToHashSet(StringComparer.Ordinal);
        if (session.AssessmentVersion != content.Assessment.Version || order.Count == 0 ||
            order.Distinct(StringComparer.Ordinal).Count() != order.Count ||
            order.Any(questionId => !sourceIds.Contains(questionId)) ||
            sourceIds.Any(questionId => !order.Contains(questionId, StringComparer.Ordinal)))
            throw new NotFoundAppException("This guided learning session is no longer available.");
    }
}
