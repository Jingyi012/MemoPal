using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.PublicLearning.DTOs;
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
            .Select(item => new { item.Id, item.Title, item.UserId, PublishedAt = item.PubliclyPublishedAt!.Value })
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

        var author = await db.Users.AsNoTracking().Where(user => user.Id == course.UserId)
            .Select(user => user.DisplayName).FirstOrDefaultAsync(ct);
        var isSaved = await db.EducationSavedCourses.AsNoTracking().AnyAsync(saved =>
            saved.UserId == q.UserId && saved.CourseId == course.Id && !saved.IsDeleted, ct);
        var objectives = await db.EducationObjectives.AsNoTracking()
            .Where(objective => objective.CourseId == course.Id && !objective.IsDeleted)
            .OrderBy(objective => objective.Title)
            .Select(objective => new { objective.Id, objective.Title, objective.RecommendedMemorySetId })
            .ToListAsync(ct);
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
            author ?? "MemoPal creator", course.PublishedAt, assessments,
            objectives.Select(objective => new EducationPublicObjectiveDto(
                objective.Id, objective.Title,
                objective.RecommendedMemorySetId is { } id ? recommended.GetValueOrDefault(id) : null)).ToArray(), isSaved));
    }
}
