using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education;
using MemoPal.Application.Features.Education.DTOs;
using MemoPal.Application.Features.Education.Family.DTOs;
using MemoPal.Application.Features.Education.Relationships;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Family.Queries;

public sealed record GetEducationFamilyReportQuery(string GuardianUserId, string StudentUserId)
    : IRequest<ApiResponse<EducationFamilyReportDto>>;

public sealed class GetEducationFamilyReportHandler(IAppDbContext db, EducationAccess access)
    : IRequestHandler<GetEducationFamilyReportQuery, ApiResponse<EducationFamilyReportDto>>
{
    public async Task<ApiResponse<EducationFamilyReportDto>> Handle(GetEducationFamilyReportQuery q, CancellationToken ct)
    {
        if (!await access.IsVerifiedGuardianAsync(q.GuardianUserId, q.StudentUserId, ct))
            throw new NotFoundAppException("Student report not found.");
        var studentName = await db.Users.AsNoTracking()
            .Where(x => x.Id == q.StudentUserId && !x.IsDeleted)
            .Select(x => x.DisplayName).FirstOrDefaultAsync(ct)
            ?? throw new NotFoundAppException("Student report not found.");

        var recipients = await db.EducationAssignmentRecipients.AsNoTracking()
            .Include(x => x.Assignment)
            .Where(x => x.StudentUserId == q.StudentUserId && !x.IsDeleted &&
                x.Assignment != null && !x.Assignment.IsDeleted)
            .OrderByDescending(x => x.DueAt)
            .ToListAsync(ct);
        var recipientIds = recipients.Select(x => x.Id).ToArray();
        var assessmentIds = recipients.Select(x => x.AssessmentId).Distinct().ToArray();
        var attempts = await db.EducationAssessmentAttempts.AsNoTracking()
            .Include(x => x.Responses)
            .Where(x => recipientIds.Contains(x.RecipientId) && x.StudentUserId == q.StudentUserId && !x.IsDeleted)
            .ToDictionaryAsync(x => x.RecipientId, ct);
        var attemptIds = attempts.Values.Select(x => x.Id).ToArray();
        var correctedAttemptIds = (await db.EducationGradeRevisions.AsNoTracking()
                .Where(x => attemptIds.Contains(x.AttemptId) && !x.IsDeleted)
                .Select(x => x.AttemptId).Distinct().ToArrayAsync(ct))
            .ToHashSet(StringComparer.Ordinal);
        var assessments = await db.EducationAssessments.AsNoTracking().Include(x => x.Questions)
            .Where(x => assessmentIds.Contains(x.Id) && !x.IsDeleted)
            .ToDictionaryAsync(x => x.Id, ct);

        var rows = recipients.Select(recipient =>
        {
            attempts.TryGetValue(recipient.Id, out var attempt);
            var status = attempt?.Status ?? "not-started";
            var resultPublished = status == EducationAssessmentAttemptStatuses.Submitted &&
                recipient.Assignment?.ResultsPublishedAt is not null;
            var performance = EducationQuestionTypePerformanceCalculator.Calculate([]);
            if (resultPublished && attempt is not null &&
                !correctedAttemptIds.Contains(attempt.Id) &&
                attempt.AssessmentId == recipient.AssessmentId &&
                attempt.AssessmentVersion == recipient.AssessmentVersion &&
                assessments.TryGetValue(recipient.AssessmentId, out var assessment) &&
                assessment.Version == recipient.AssessmentVersion)
            {
                var questions = assessment.Questions.Where(x => !x.IsDeleted).ToDictionary(x => x.Id);
                var evidence = attempt.Responses.Where(response => !response.IsDeleted && response.Score.HasValue &&
                        questions.ContainsKey(response.QuestionId))
                    .Select(response =>
                    {
                        var question = questions[response.QuestionId];
                        return new EducationScoredQuestionEvidence(
                            assessment.Id, question.Id, question.Type, attempt.SubmittedAt!.Value,
                            response.Score!.Value, question.MaxScore);
                    });
                performance = EducationQuestionTypePerformanceCalculator.Calculate(evidence);
            }
            return new EducationFamilyAssignmentProgressDto(
                recipient.AssignmentId,
                recipient.Title,
                recipient.Assignment?.Scope ?? EducationAssignmentScopes.Classroom,
                recipient.OpensAt,
                recipient.DueAt,
                status,
                attempt?.StartedAt,
                attempt?.SubmittedAt,
                resultPublished,
                resultPublished ? attempt?.Score : null,
                resultPublished ? attempt?.MaxScore : null,
                performance.SelectedResponse,
                performance.OpenResponse);
        }).ToArray();
        var report = new EducationFamilyReportDto(q.StudentUserId, studentName, rows.Length,
            rows.Count(x => x.Status == "not-started"),
            rows.Count(x => x.Status == EducationAssessmentAttemptStatuses.InProgress),
            rows.Count(x => x.Status == EducationAssessmentAttemptStatuses.Submitted),
            rows.Count(x => x.ResultPublished), rows);
        return ApiResponse<EducationFamilyReportDto>.Ok(report);
    }
}
