using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Attempts.DTOs;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;

namespace MemoPal.Application.Features.Education.Attempts.Commands;

public sealed record CheckEducationPracticeAnswerCommand(
    string UserId, string AttemptId, EducationPracticeCheckRequest Request)
    : IRequest<ApiResponse<EducationPracticeCheckDto>>;

public sealed class CheckEducationPracticeAnswerHandler(IAppDbContext db)
    : IRequestHandler<CheckEducationPracticeAnswerCommand, ApiResponse<EducationPracticeCheckDto>>
{
    public async Task<ApiResponse<EducationPracticeCheckDto>> Handle(CheckEducationPracticeAnswerCommand q, CancellationToken ct)
    {
        var attempt = await EducationAttemptValidation.OwnedAttemptAsync(db, q.UserId, q.AttemptId, ct);
        if (attempt.Status != EducationAssessmentAttemptStatuses.Submitted || attempt.Recipient!.Assignment!.ResultsPublishedAt is null)
            throw new ConflictAppException("Practice review is available after assignment results are published.");

        var assessment = await EducationAttemptValidation.PublishedSnapshotAsync(db, attempt, ct);
        var question = EducationAttemptValidation.Question(assessment, q.Request.QuestionId);
        if (!EducationPracticeQuestionTypes.IsSupported(question.Type))
            throw new ValidationAppException("Only objective questions can be reviewed in practice mode.");

        var answer = EducationAttemptMapping.ParseAnswer(q.Request.Answer, question);
        ObjectiveQuestionGrade grade;
        try { grade = ObjectiveQuestionScorer.Grade(EducationAttemptMapping.Definition(question), answer); }
        catch (ArgumentException ex) { throw new ValidationAppException(ex.Message); }

        return ApiResponse<EducationPracticeCheckDto>.Ok(
            new(question.Id, grade.Score, grade.MaxScore, grade.IsCorrect));
    }
}
