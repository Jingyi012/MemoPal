using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Attempts;
using MemoPal.Application.Features.Education.Attempts.DTOs;
using MemoPal.Application.Features.Education.PublicLearning.DTOs;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.PublicLearning.Commands;

public sealed record CheckEducationPublicPracticeAnswerCommand(string UserId, string CourseId, EducationPublicPracticeAnswerRequest Request)
    : IRequest<ApiResponse<EducationPublicPracticeAnswerDto>>;

public sealed class CheckEducationPublicPracticeAnswerHandler(IAppDbContext db)
    : IRequestHandler<CheckEducationPublicPracticeAnswerCommand, ApiResponse<EducationPublicPracticeAnswerDto>>
{
    public async Task<ApiResponse<EducationPublicPracticeAnswerDto>> Handle(CheckEducationPublicPracticeAnswerCommand q, CancellationToken ct)
    {
        var question = await db.EducationQuestions.AsNoTracking()
            .Where(item => item.Id == q.Request.QuestionId && !item.IsDeleted && item.AssessmentId == q.Request.AssessmentId &&
                item.Assessment != null && item.Assessment.CourseId == q.CourseId && !item.Assessment.IsDeleted &&
                item.Assessment.Status == EducationAssessmentStatuses.Published && item.Assessment.IsPublicPractice && item.Assessment.Course != null &&
                item.Assessment.Course.IsPublic && !item.Assessment.Course.IsModerationHidden && !item.Assessment.Course.IsDeleted &&
                item.Assessment.Course.PubliclyPublishedAt != null)
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundAppException("Public practice question not found.");
        if (!EducationPracticeQuestionTypes.IsSupported(question.Type))
            throw new ValidationAppException("Only objective questions are available in public practice.");

        var answer = EducationAttemptMapping.ParseAnswer(q.Request.Answer, question);
        ObjectiveQuestionGrade grade;
        try { grade = ObjectiveQuestionScorer.Grade(EducationAttemptMapping.Definition(question), answer); }
        catch (ArgumentException ex) { throw new ValidationAppException(ex.Message); }
        var progress = await db.EducationPublicPracticeProgress.FirstOrDefaultAsync(item =>
            item.UserId == q.UserId && item.QuestionId == question.Id && !item.IsDeleted, ct);
        if (progress is null)
        {
            db.EducationPublicPracticeProgress.Add(new EducationPublicPracticeProgress
            {
                UserId = q.UserId,
                CourseId = q.CourseId,
                AssessmentId = question.AssessmentId,
                QuestionId = question.Id,
                LastAnswerCorrect = grade.IsCorrect,
                LastAnsweredAtUtc = DateTime.UtcNow
            });
        }
        else
        {
            progress.LastAnswerCorrect = grade.IsCorrect;
            progress.LastAnsweredAtUtc = DateTime.UtcNow;
        }
        await db.SaveChangesAsync(ct);
        return ApiResponse<EducationPublicPracticeAnswerDto>.Ok(new(question.Id, grade.IsCorrect, question.Explanation));
    }
}
