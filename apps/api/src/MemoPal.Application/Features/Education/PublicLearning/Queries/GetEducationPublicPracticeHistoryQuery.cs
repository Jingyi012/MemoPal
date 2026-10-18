using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.PublicLearning.DTOs;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.PublicLearning.Queries;

public sealed record GetEducationPublicPracticeHistoryQuery(string UserId)
    : IRequest<ApiResponse<IReadOnlyList<EducationPublicPracticeHistoryItemDto>>>;

public sealed class GetEducationPublicPracticeHistoryHandler(IAppDbContext db)
    : IRequestHandler<GetEducationPublicPracticeHistoryQuery, ApiResponse<IReadOnlyList<EducationPublicPracticeHistoryItemDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<EducationPublicPracticeHistoryItemDto>>> Handle(
        GetEducationPublicPracticeHistoryQuery query, CancellationToken ct)
    {
        var history = await (
            from progress in db.EducationPublicPracticeProgress.AsNoTracking()
            join question in db.EducationQuestions.AsNoTracking() on progress.QuestionId equals question.Id
            join assessment in db.EducationAssessments.AsNoTracking() on progress.AssessmentId equals assessment.Id
            join course in db.EducationCourses.AsNoTracking() on progress.CourseId equals course.Id
            join objective in db.EducationObjectives.AsNoTracking() on question.ObjectiveId equals objective.Id
            where progress.UserId == query.UserId && !progress.IsDeleted && !question.IsDeleted &&
                !assessment.IsDeleted && assessment.Status == EducationAssessmentStatuses.Published && assessment.IsPublicPractice &&
                !course.IsDeleted && course.IsPublic && !course.IsModerationHidden && course.PubliclyPublishedAt != null && !objective.IsDeleted
            orderby progress.LastAnsweredAtUtc descending
            select new EducationPublicPracticeHistoryItemDto(
                course.Id, course.Title, assessment.Id, assessment.Title,
                question.Id, question.Prompt, objective.Title, progress.LastAnswerCorrect, progress.LastAnsweredAtUtc))
            .Take(100)
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<EducationPublicPracticeHistoryItemDto>>.Ok(history);
    }
}
