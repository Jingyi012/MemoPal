using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.PublicLearning.DTOs;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.PublicLearning.Queries;

public sealed record GetEducationPublicCoursesQuery(string UserId, string? Search, bool SavedOnly = false)
    : IRequest<ApiResponse<IReadOnlyList<EducationPublicCourseSummaryDto>>>;

public sealed class GetEducationPublicCoursesHandler(IAppDbContext db)
    : IRequestHandler<GetEducationPublicCoursesQuery, ApiResponse<IReadOnlyList<EducationPublicCourseSummaryDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<EducationPublicCourseSummaryDto>>> Handle(GetEducationPublicCoursesQuery q, CancellationToken ct)
    {
        var supportedTypes = new[]
        {
            ObjectiveQuestionTypeCodes.SingleChoice, ObjectiveQuestionTypeCodes.TrueFalse,
            ObjectiveQuestionTypeCodes.FillBlank, ObjectiveQuestionTypeCodes.MultipleSelect,
            ObjectiveQuestionTypeCodes.Ordering, ObjectiveQuestionTypeCodes.Matching
        };
        var search = q.Search?.Trim();
        if (search?.Length > 100) search = search[..100];
        var courses = await db.EducationCourses.AsNoTracking()
            .Where(course => course.IsPublic && !course.IsModerationHidden && !course.IsDeleted && course.PubliclyPublishedAt != null &&
                (string.IsNullOrEmpty(search) || course.Title.ToLower().Contains(search.ToLower())) &&
                (!q.SavedOnly || db.EducationSavedCourses.Any(saved => saved.UserId == q.UserId && saved.CourseId == course.Id && !saved.IsDeleted)))
            .OrderByDescending(course => course.PubliclyPublishedAt)
            .ThenBy(course => course.Title)
            .Take(100)
            .Select(course => new { course.Id, course.Title, course.UserId, PublishedAt = course.PubliclyPublishedAt!.Value })
            .ToListAsync(ct);

        if (courses.Count == 0)
            return ApiResponse<IReadOnlyList<EducationPublicCourseSummaryDto>>.Ok([]);

        var courseIds = courses.Select(course => course.Id).ToArray();
        var assessmentRows = await db.EducationAssessments.AsNoTracking()
            .Where(assessment => courseIds.Contains(assessment.CourseId) && !assessment.IsDeleted &&
                assessment.Status == EducationAssessmentStatuses.Published && assessment.IsPublicPractice)
            .Join(db.EducationQuestions.AsNoTracking().Where(question => !question.IsDeleted && supportedTypes.Contains(question.Type)),
                assessment => assessment.Id, question => question.AssessmentId,
                (assessment, question) => new { assessment.CourseId, AssessmentId = assessment.Id, QuestionId = question.Id })
            .ToListAsync(ct);
        var authorIds = courses.Select(course => course.UserId).Distinct().ToArray();
        var authors = await db.Users.AsNoTracking().Where(user => authorIds.Contains(user.Id))
            .ToDictionaryAsync(user => user.Id, user => user.DisplayName, ct);
        var assessmentCounts = assessmentRows.GroupBy(row => row.CourseId)
            .ToDictionary(group => group.Key, group => group.Select(row => row.AssessmentId).Distinct().Count());
        var questionCounts = assessmentRows.GroupBy(row => row.CourseId)
            .ToDictionary(group => group.Key, group => group.Count());
        var savedCourseIds = await db.EducationSavedCourses.AsNoTracking()
            .Where(saved => saved.UserId == q.UserId && !saved.IsDeleted && courseIds.Contains(saved.CourseId))
            .Select(saved => saved.CourseId)
            .ToHashSetAsync(ct);

        var result = courses.Where(course => assessmentCounts.ContainsKey(course.Id))
            .Select(course => new EducationPublicCourseSummaryDto(course.Id, course.Title,
                course.UserId == "system" ? "MemoPal" : authors.GetValueOrDefault(course.UserId) ?? "MemoPal creator", course.PublishedAt,
                assessmentCounts.GetValueOrDefault(course.Id), questionCounts.GetValueOrDefault(course.Id), savedCourseIds.Contains(course.Id),
                course.UserId == "system"))
            .OrderByDescending(course => course.IsMemoPalStarter)
            .ThenByDescending(course => course.PublishedAt)
            .ThenBy(course => course.Title)
            .ToArray();
        return ApiResponse<IReadOnlyList<EducationPublicCourseSummaryDto>>.Ok(result);
    }
}
