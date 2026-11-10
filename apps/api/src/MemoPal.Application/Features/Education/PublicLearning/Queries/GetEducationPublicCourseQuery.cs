using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.PublicLearning.DTOs;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using MemoPal.Application.Features.Education.Authoring;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;
using MemoPal.Application.Features.CommunityMemorySets.Queries;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.PublicLearning.Queries;

public sealed record GetEducationPublicCourseQuery(string UserId, string CourseId)
    : IRequest<ApiResponse<EducationPublicCourseDetailDto>>;

public sealed class GetEducationPublicCourseHandler(IAppDbContext db)
    : IRequestHandler<GetEducationPublicCourseQuery, ApiResponse<EducationPublicCourseDetailDto>>
{
    public async Task<ApiResponse<EducationPublicCourseDetailDto>> Handle(GetEducationPublicCourseQuery q, CancellationToken ct)
    {
        var course = await db.EducationCourses.AsNoTracking()
            .Where(item => item.Id == q.CourseId && item.IsPublic && !item.IsModerationHidden && !item.IsDeleted && item.PubliclyPublishedAt != null)
            .Select(item => new { item.Id, item.Title, item.UserId, item.SubjectCode, item.LearningStage, item.LanguageCode, PublishedAt = item.PubliclyPublishedAt!.Value })
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundAppException("Public course not found.");

        var supportedTypes = new[]
        {
            ObjectiveQuestionTypeCodes.SingleChoice, ObjectiveQuestionTypeCodes.TrueFalse,
            ObjectiveQuestionTypeCodes.FillBlank, ObjectiveQuestionTypeCodes.MultipleSelect,
            ObjectiveQuestionTypeCodes.Ordering, ObjectiveQuestionTypeCodes.Matching
        };
        var rows = await db.EducationAssessments.AsNoTracking()
            .Where(assessment => assessment.CourseId == course.Id && !assessment.IsDeleted &&
                assessment.Status == EducationAssessmentStatuses.Published && assessment.IsPublicPractice)
            .Join(db.EducationQuestions.AsNoTracking().Where(question => !question.IsDeleted && supportedTypes.Contains(question.Type)),
                assessment => assessment.Id, question => question.AssessmentId,
                (assessment, question) => new { assessment.Id, assessment.Title, PublishedAt = assessment.PublishedAt!.Value, question.Type })
            .ToListAsync(ct);
        var assessments = rows.GroupBy(row => new { row.Id, row.Title, row.PublishedAt })
            .OrderBy(group => group.Key.Title)
            .Select(group => new EducationPublicAssessmentSummaryDto(group.Key.Id, group.Key.Title, group.Key.PublishedAt,
                group.Count(), group.Select(row => row.Type).Distinct().Order().ToArray()))
            .ToArray();
        if (assessments.Length == 0)
            throw new NotFoundAppException("Public course not found.");

        var author = course.UserId == "system"
            ? "MemoPal"
            : await db.Users.AsNoTracking().Where(user => user.Id == course.UserId)
                .Select(user => user.DisplayName).FirstOrDefaultAsync(ct) ?? "MemoPal creator";
        var isSaved = await db.EducationSavedCourses.AsNoTracking().AnyAsync(saved =>
            saved.UserId == q.UserId && saved.CourseId == course.Id && !saved.IsDeleted, ct);
        var objectives = await db.EducationObjectives.AsNoTracking()
            .Where(objective => objective.CourseId == course.Id && !objective.IsDeleted)
            .OrderBy(objective => objective.Title)
            .Select(objective => new { objective.Id, objective.Title, objective.RecommendedMemorySetId, objective.ReviewStatus, objective.ContentOrigin })
            .ToListAsync(ct);
        var objectiveIds = objectives.Select(objective => objective.Id).ToArray();
        var studyItems = await db.EducationObjectiveStudyItems.AsNoTracking()
            .Where(item => objectiveIds.Contains(item.ObjectiveId) && !item.IsDeleted &&
                item.Status == EducationStudyItemStatus.Published)
            .OrderBy(item => item.ObjectiveId).ThenBy(item => item.Position).ThenBy(item => item.Id)
            .Select(item => new
            {
                item.Id, item.ObjectiveId, item.Position, item.Kind, item.Primary, item.Secondary,
                item.Phonetic, item.Extra, item.LanguageCode, item.ContentVersion, item.MediaRef
            }).ToListAsync(ct);
        var itemsByObjective = studyItems.GroupBy(item => item.ObjectiveId).ToDictionary(group => group.Key,
            group => (IReadOnlyList<EducationLearnerStudyItemDto>)group.Select(item => new EducationLearnerStudyItemDto(
                item.Id, item.Position, item.Kind.ToString(), item.Primary, item.Secondary, item.Phonetic, item.Extra,
                item.LanguageCode, item.ContentVersion,
                objectives.Single(objective => objective.Id == item.ObjectiveId).ReviewStatus.ToString(),
                objectives.Single(objective => objective.Id == item.ObjectiveId).ContentOrigin.ToString(),
                EducationStudyIllustrations.FromMediaReference(item.MediaRef))).ToArray(),
            StringComparer.Ordinal);
        var recommendedIds = objectives.Where(objective => objective.RecommendedMemorySetId != null)
            .Select(objective => objective.RecommendedMemorySetId!).Distinct().ToArray();
        var recommended = recommendedIds.Length == 0
            ? new Dictionary<string, EducationRecommendedMemorySetDto>()
            : await db.MemorySets.AsNoTracking()
                .Where(GetCommunityMemorySetsQueryHandler.IsDiscoverable())
                .Where(memory => db.Users.Any(author => author.Id == memory.UserId && !author.IsDeleted && author.AccountMode == MemoPal.Domain.Common.AccountMode.Standard))
                .Where(memorySet => recommendedIds.Contains(memorySet.Id))
                .Select(memorySet => new EducationRecommendedMemorySetDto(
                    memorySet.Id, memorySet.Title, memorySet.GoalType, memorySet.TechniqueKey, memorySet.Description))
                .ToDictionaryAsync(memorySet => memorySet.Id, ct);
        return ApiResponse<EducationPublicCourseDetailDto>.Ok(new(course.Id, course.Title,
            author, course.PublishedAt, assessments,
            objectives.Select(objective => new EducationPublicObjectiveDto(
                objective.Id, objective.Title,
                objective.RecommendedMemorySetId is { } id ? recommended.GetValueOrDefault(id) : null,
                itemsByObjective.GetValueOrDefault(objective.Id) ?? [])).ToArray(), isSaved,
            course.UserId == "system", course.SubjectCode, course.LearningStage, course.LanguageCode,
            await EducationCourseOutlineReader.Read(db, course.Id, ct)));
    }
}
