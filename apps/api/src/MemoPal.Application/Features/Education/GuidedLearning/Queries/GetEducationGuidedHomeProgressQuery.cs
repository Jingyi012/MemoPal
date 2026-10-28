using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.GuidedLearning.DTOs;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.GuidedLearning.Queries;

public sealed record GetEducationGuidedHomeProgressQuery(string UserId)
    : IRequest<ApiResponse<EducationGuidedCourseProgressDto?>>;

/// <summary>Returns the most recently active course that is still in the public learning catalog.</summary>
public sealed class GetEducationGuidedHomeProgressHandler(IAppDbContext db)
    : IRequestHandler<GetEducationGuidedHomeProgressQuery, ApiResponse<EducationGuidedCourseProgressDto?>>
{
    public async Task<ApiResponse<EducationGuidedCourseProgressDto?>> Handle(
        GetEducationGuidedHomeProgressQuery query, CancellationToken ct)
    {
        var supportedTypes = new[]
        {
            ObjectiveQuestionTypeCodes.SingleChoice, ObjectiveQuestionTypeCodes.TrueFalse,
            ObjectiveQuestionTypeCodes.FillBlank, ObjectiveQuestionTypeCodes.MultipleSelect,
            ObjectiveQuestionTypeCodes.Ordering, ObjectiveQuestionTypeCodes.Matching
        };
        var visibleCurrentSessions =
            from session in db.EducationGuidedLearningSessions.AsNoTracking()
            join assessment in db.EducationAssessments.AsNoTracking() on session.AssessmentId equals assessment.Id
            join course in db.EducationCourses.AsNoTracking() on session.CourseId equals course.Id
            where session.UserId == query.UserId && !session.IsDeleted &&
                session.AssessmentVersion == assessment.Version && !assessment.IsDeleted &&
                assessment.Status == EducationAssessmentStatuses.Published && assessment.IsPublicPractice &&
                assessment.CourseId == course.Id && assessment.UserId == course.UserId &&
                !course.IsDeleted && !course.IsModerationHidden && course.IsPublic &&
                course.PubliclyPublishedAt != null &&
                db.EducationQuestions.Any(question => question.AssessmentId == assessment.Id && !question.IsDeleted &&
                    supportedTypes.Contains(question.Type) && db.EducationObjectives.Any(objective =>
                        objective.Id == question.ObjectiveId && objective.CourseId == course.Id && !objective.IsDeleted))
            select session;

        var courseId = await visibleCurrentSessions
            .Where(session => session.Questions.Any(question => !question.IsDeleted && question.AttemptCount == 0))
            .OrderByDescending(session => session.UpdatedAt).ThenByDescending(session => session.StartedAtUtc)
            .Select(session => session.CourseId).FirstOrDefaultAsync(ct);
        courseId ??= await visibleCurrentSessions
            .OrderByDescending(session => session.UpdatedAt).ThenByDescending(session => session.StartedAtUtc)
            .Select(session => session.CourseId).FirstOrDefaultAsync(ct);

        if (courseId is null) return ApiResponse<EducationGuidedCourseProgressDto?>.Ok(null);
        var response = await new GetEducationGuidedCourseProgressHandler(db).Handle(
            new GetEducationGuidedCourseProgressQuery(query.UserId, courseId), ct);
        return ApiResponse<EducationGuidedCourseProgressDto?>.Ok(response.Data);
    }
}
