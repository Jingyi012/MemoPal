using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Attempts;
using MemoPal.Application.Features.Education.Authoring;
using MemoPal.Application.Features.Education.GuidedLearning.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.GuidedLearning.Queries;

public sealed record GetEducationGuidedCourseProgressQuery(string UserId, string CourseId, string? ClassroomId = null)
    : IRequest<ApiResponse<EducationGuidedCourseProgressDto>>;

public sealed class GetEducationGuidedCourseProgressHandler(IAppDbContext db)
    : IRequestHandler<GetEducationGuidedCourseProgressQuery, ApiResponse<EducationGuidedCourseProgressDto>>
{
    public async Task<ApiResponse<EducationGuidedCourseProgressDto>> Handle(GetEducationGuidedCourseProgressQuery query, CancellationToken ct)
    {
        var course = await EducationGuidedLearningContentReader.ReadCourseAsync(db, query.UserId,
            query.CourseId, query.ClassroomId, ct);
        var assessments = await db.EducationAssessments.AsNoTracking().Include(item => item.Questions)
            .Where(item => item.CourseId == course.Id && !item.IsDeleted &&
                item.Status == EducationAssessmentStatuses.Published && item.IsPublicPractice)
            .OrderBy(item => item.PublishedAt).ThenBy(item => item.Id).ToListAsync(ct);
        var objectiveIds = assessments.SelectMany(item => item.Questions)
            .Where(question => !question.IsDeleted && EducationPracticeQuestionTypes.IsSupported(question.Type))
            .Select(question => question.ObjectiveId).Distinct().ToArray();
        var objectiveTitles = await db.EducationObjectives.AsNoTracking()
            .Where(objective => objectiveIds.Contains(objective.Id) && objective.CourseId == course.Id && !objective.IsDeleted)
            .ToDictionaryAsync(objective => objective.Id, objective => objective.Title, ct);
        assessments = assessments.Where(assessment => assessment.Questions.Any(question =>
            !question.IsDeleted && EducationPracticeQuestionTypes.IsSupported(question.Type) && objectiveTitles.ContainsKey(question.ObjectiveId))).ToList();

        var assessmentIds = assessments.Select(item => item.Id).ToArray();
        var assessmentVersions = assessments.ToDictionary(item => item.Id, item => item.Version, StringComparer.Ordinal);
        var sessions = await db.EducationGuidedLearningSessions.AsNoTracking().Include(item => item.Questions)
            .Where(item => item.UserId == query.UserId && item.CourseId == course.Id && !item.IsDeleted && assessmentIds.Contains(item.AssessmentId))
            .ToListAsync(ct);
        var sessionsByAssessment = sessions.Where(item => assessmentVersions.GetValueOrDefault(item.AssessmentId) == item.AssessmentVersion)
            .ToDictionary(item => item.AssessmentId, StringComparer.Ordinal);

        var lessons = assessments.Select(assessment =>
        {
            var questions = assessment.Questions.Where(question => !question.IsDeleted &&
                EducationPracticeQuestionTypes.IsSupported(question.Type) && objectiveTitles.ContainsKey(question.ObjectiveId)).ToArray();
            var objectives = questions.Select(question => question.ObjectiveId).Distinct(StringComparer.Ordinal)
                .Select(objectiveId => new EducationGuidedObjectiveSummaryDto(objectiveId,
                    objectiveTitles.GetValueOrDefault(objectiveId) ?? "Learning objective"))
                .ToArray();
            var progressSession = sessionsByAssessment.GetValueOrDefault(assessment.Id);
            var questionProgress = progressSession?.Questions.Where(item => !item.IsDeleted).ToArray() ?? [];
            return EducationGuidedLearningMapper.ToLessonProgressDto(assessment, questions, objectives, progressSession, questionProgress);
        }).ToArray();

        var units = await EducationCourseOutlineReader.Read(db, course.Id, ct);
        var objectiveOrder = units.SelectMany(unit => unit.ObjectiveIds)
            .Select((id, index) => (id, index)).ToDictionary(item => item.id, item => item.index, StringComparer.Ordinal);
        // A lesson spanning several objectives follows the last prerequisite in the authored path.
        // Stable ordering preserves publication order within a step and for legacy, ungrouped lessons.
        lessons = lessons.OrderBy(lesson => lesson.Objectives
            .Select(objective => objectiveOrder.GetValueOrDefault(objective.ObjectiveId, int.MaxValue))
            .DefaultIfEmpty(int.MaxValue).Max()).ToArray();

        var next = lessons.FirstOrDefault(lesson => !lesson.IsComplete)?.AssessmentId
            ?? lessons.FirstOrDefault(lesson => lesson.LatestIncorrectQuestionCount > 0)?.AssessmentId;
        return ApiResponse<EducationGuidedCourseProgressDto>.Ok(new(course.Id, course.Title, lessons,
            lessons.Count(lesson => lesson.IsComplete), next));
    }
}
