using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Attempts;
using MemoPal.Application.Features.Education.Attempts.DTOs;
using MemoPal.Application.Features.Education.PublicLearning.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.PublicLearning.Queries;

public sealed record GetEducationPublicPracticeAssessmentQuery(string CourseId, string AssessmentId)
    : IRequest<ApiResponse<EducationPublicPracticeAssessmentDto>>;

public sealed class GetEducationPublicPracticeAssessmentHandler(IAppDbContext db)
    : IRequestHandler<GetEducationPublicPracticeAssessmentQuery, ApiResponse<EducationPublicPracticeAssessmentDto>>
{
    public async Task<ApiResponse<EducationPublicPracticeAssessmentDto>> Handle(GetEducationPublicPracticeAssessmentQuery q, CancellationToken ct)
    {
        var course = await db.EducationCourses.AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == q.CourseId && item.IsPublic && !item.IsModerationHidden && !item.IsDeleted && item.PubliclyPublishedAt != null, ct)
            ?? throw new NotFoundAppException("Public course not found.");
        var assessment = await db.EducationAssessments.AsNoTracking().Include(item => item.Questions)
            .FirstOrDefaultAsync(item => item.Id == q.AssessmentId && item.CourseId == course.Id &&
                !item.IsDeleted && item.Status == EducationAssessmentStatuses.Published && item.IsPublicPractice, ct)
            ?? throw new NotFoundAppException("Public assessment not found.");
        var objectives = await db.EducationObjectives.AsNoTracking()
            .Where(objective => objective.CourseId == course.Id && !objective.IsDeleted)
            .ToDictionaryAsync(objective => objective.Id, objective => objective.Title, ct);
        var questions = assessment.Questions.Where(question => !question.IsDeleted && EducationPracticeQuestionTypes.IsSupported(question.Type))
            .OrderBy(question => question.Position)
            .Select(question => new EducationPublicPracticeQuestionDto(
                EducationAttemptMapping.ToStudentQuestion(question),
                objectives.GetValueOrDefault(question.ObjectiveId) ?? "Learning objective"))
            .ToArray();
        if (questions.Length == 0)
            throw new NotFoundAppException("Public assessment not found.");
        return ApiResponse<EducationPublicPracticeAssessmentDto>.Ok(new(assessment.Id, course.Id,
            assessment.Title, assessment.PublishedAt ?? course.PubliclyPublishedAt!.Value, questions));
    }
}
