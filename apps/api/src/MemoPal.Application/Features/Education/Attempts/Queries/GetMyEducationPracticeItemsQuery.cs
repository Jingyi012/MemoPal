using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Attempts.Queries;

public sealed record EducationPracticeQuestionTypeCountDto(string Type, int Count);

public sealed record EducationPracticeItemDto(
    string AttemptId,
    string AssignmentId,
    string Title,
    DateTime? SubmittedAt,
    int QuestionCount,
    IReadOnlyList<EducationPracticeQuestionTypeCountDto> QuestionTypes);

public sealed record GetMyEducationPracticeItemsQuery(string UserId)
    : IRequest<ApiResponse<IReadOnlyList<EducationPracticeItemDto>>>;

public sealed class GetMyEducationPracticeItemsHandler(IAppDbContext db)
    : IRequestHandler<GetMyEducationPracticeItemsQuery, ApiResponse<IReadOnlyList<EducationPracticeItemDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<EducationPracticeItemDto>>> Handle(GetMyEducationPracticeItemsQuery q, CancellationToken ct)
    {
        var attempts = await db.EducationAssessmentAttempts.AsNoTracking()
            .Where(attempt => attempt.StudentUserId == q.UserId && !attempt.IsDeleted &&
                attempt.Status == EducationAssessmentAttemptStatuses.Submitted &&
                attempt.Recipient != null && !attempt.Recipient.IsDeleted &&
                attempt.Recipient.StudentUserId == q.UserId && attempt.Recipient.Assignment != null &&
                !attempt.Recipient.Assignment.IsDeleted && attempt.Recipient.Assignment.ResultsPublishedAt != null)
            .OrderByDescending(attempt => attempt.SubmittedAt)
            .Select(attempt => new
            {
                attempt.Id,
                attempt.AssessmentId,
                attempt.AssessmentVersion,
                attempt.SubmittedAt,
                AssignmentId = attempt.Recipient!.AssignmentId,
                Title = attempt.Recipient.Assignment!.Title
            })
            .ToListAsync(ct);

        var assessmentIds = attempts.Select(x => x.AssessmentId).Distinct().ToArray();
        var assessments = await db.EducationAssessments.AsNoTracking().Include(x => x.Questions)
            .Where(assessment => assessmentIds.Contains(assessment.Id) && !assessment.IsDeleted &&
                assessment.Status == EducationAssessmentStatuses.Published)
            .ToListAsync(ct);
        var assessmentById = assessments.ToDictionary(x => x.Id);
        var items = attempts.Select(attempt =>
            {
                if (!assessmentById.TryGetValue(attempt.AssessmentId, out var assessment) ||
                    assessment.Version != attempt.AssessmentVersion)
                    return null;

                var types = assessment.Questions.Where(question => !question.IsDeleted &&
                        EducationPracticeQuestionTypes.IsSupported(question.Type))
                    .OrderBy(question => question.Position)
                    .GroupBy(question => question.Type)
                    .Select(group => new EducationPracticeQuestionTypeCountDto(group.Key, group.Count()))
                    .ToArray();
                return types.Length == 0 ? null : new EducationPracticeItemDto(
                    attempt.Id, attempt.AssignmentId, attempt.Title, attempt.SubmittedAt,
                    types.Sum(x => x.Count), types);
            })
            .Where(item => item is not null)
            .Cast<EducationPracticeItemDto>()
            .ToArray();

        return ApiResponse<IReadOnlyList<EducationPracticeItemDto>>.Ok(items);
    }
}
