using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using MemoPal.Application.Features.Education.Attempts;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Authoring;

public sealed record SetEducationCourseVisibilityCommand(string UserId, string CourseId, bool IsPublic, bool NotConfidentialExamContent = false, bool IsAdmin = false)
    : IRequest<ApiResponse<EducationCourseDto>>;

public sealed class SetEducationCourseVisibilityHandler(IAppDbContext db)
    : IRequestHandler<SetEducationCourseVisibilityCommand, ApiResponse<EducationCourseDto>>
{
    public async Task<ApiResponse<EducationCourseDto>> Handle(SetEducationCourseVisibilityCommand q, CancellationToken ct)
    {
        var course = await AuthoringValidation.OwnedCourse(db, q.UserId, q.CourseId, ct, q.IsAdmin);
        if (q.IsPublic)
        {
            if (!q.NotConfidentialExamContent &&
                (!course.IsPublic || course.NotConfidentialExamContentConfirmedAtUtc is null))
                throw new ValidationAppException("Explicitly confirm that the course contains no confidential exam content before making it public.");
            var supportedTypes = new[]
            {
                ObjectiveQuestionTypeCodes.SingleChoice,
                ObjectiveQuestionTypeCodes.TrueFalse,
                ObjectiveQuestionTypeCodes.FillBlank,
                ObjectiveQuestionTypeCodes.MultipleSelect,
                ObjectiveQuestionTypeCodes.Ordering,
                ObjectiveQuestionTypeCodes.Matching
            };
            var hasPracticeQuestions = await db.EducationAssessments.AsNoTracking()
                .Where(assessment => assessment.CourseId == course.Id && assessment.UserId == course.UserId &&
                    !assessment.IsDeleted && assessment.Status == EducationAssessmentStatuses.Published && assessment.IsPublicPractice)
                .Join(db.EducationQuestions.AsNoTracking().Where(question => !question.IsDeleted),
                    assessment => assessment.Id, question => question.AssessmentId,
                    (_, question) => question.Type)
                .AnyAsync(type => supportedTypes.Contains(type), ct);
            if (!hasPracticeQuestions)
                throw new ValidationAppException("Publish at least one assessment containing objective practice questions before making this course public.");
        }

        if (q.IsPublic && q.NotConfidentialExamContent)
            course.ConfirmNotConfidentialExamContent(q.UserId, DateTime.UtcNow);
        course.SetPublic(q.IsPublic, DateTime.UtcNow);
        await db.SaveChangesAsync(ct);
        return ApiResponse<EducationCourseDto>.Ok(new(course.Id, course.Title, course.CreatedAt, course.IsPublic,
            course.PubliclyPublishedAt, course.UserId == AuthoringValidation.SystemOwnerId));
    }
}
