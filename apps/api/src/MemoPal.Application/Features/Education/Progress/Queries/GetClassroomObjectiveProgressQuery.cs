using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education;
using MemoPal.Application.Features.Education.DTOs;
using MemoPal.Application.Features.Education.Progress.DTOs;
using MemoPal.Application.Features.Education.Relationships;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Progress.Queries;

public sealed record GetClassroomObjectiveProgressQuery(string UserId, string ClassroomId)
    : IRequest<ApiResponse<EducationClassroomObjectiveProgressDto>>;

public sealed class GetClassroomObjectiveProgressHandler(IAppDbContext db, EducationAccess access)
    : IRequestHandler<GetClassroomObjectiveProgressQuery, ApiResponse<EducationClassroomObjectiveProgressDto>>
{
    public async Task<ApiResponse<EducationClassroomObjectiveProgressDto>> Handle(
        GetClassroomObjectiveProgressQuery q, CancellationToken ct)
    {
        if (!await access.IsActiveClassTeacherAsync(q.UserId, q.ClassroomId, ct))
            throw new NotFoundAppException("Classroom not found.");

        var generatedAt = DateTime.UtcNow;
        var windowStart = generatedAt.AddDays(-30);
        var memberships = await db.EducationMemberships.AsNoTracking()
            .Where(x => x.ClassroomId == q.ClassroomId && x.Role == EducationMembershipRoles.Student &&
                x.Status == EducationRelationshipStatuses.Active && !x.IsDeleted)
            .Select(x => x.UserId).Distinct().ToArrayAsync(ct);
        var studentNames = await db.Users.AsNoTracking()
            .Where(x => memberships.Contains(x.Id) && !x.IsDeleted)
            .ToDictionaryAsync(x => x.Id, x => x.DisplayName, ct);

        var assignments = await db.EducationAssignments.AsNoTracking()
            .Where(x => x.ClassroomId == q.ClassroomId && x.Scope == EducationAssignmentScopes.Classroom &&
                x.RetakeOfAssignmentId == null && !x.IsDeleted)
            .ToListAsync(ct);
        var assignmentIds = assignments.Select(x => x.Id).ToArray();
        var assessmentIds = assignments.Select(x => x.AssessmentId).Distinct().ToArray();
        var assessments = await db.EducationAssessments.AsNoTracking()
            .Include(x => x.Questions)
            .Where(x => assessmentIds.Contains(x.Id) && x.Status == EducationAssessmentStatuses.Published && !x.IsDeleted)
            .ToListAsync(ct);
        var assessmentById = assessments.ToDictionary(x => x.Id);
        var questionById = assessments.SelectMany(assessment => assessment.Questions
                .Where(question => !question.IsDeleted)
                .Select(question => new { Assessment = assessment, Question = question }))
            .ToDictionary(x => x.Question.Id);
        var objectiveIds = questionById.Values.Select(x => x.Question.ObjectiveId).Distinct().ToArray();
        var objectives = await db.EducationObjectives.AsNoTracking().Include(x => x.Course)
            .Where(x => objectiveIds.Contains(x.Id) && !x.IsDeleted)
            .ToDictionaryAsync(x => x.Id, ct);

        var recipients = await db.EducationAssignmentRecipients.AsNoTracking()
            .Where(x => assignmentIds.Contains(x.AssignmentId) && memberships.Contains(x.StudentUserId) && !x.IsDeleted)
            .ToListAsync(ct);
        var assignmentById = assignments.ToDictionary(x => x.Id);
        var recipientById = recipients.ToDictionary(x => x.Id);
        var recipientsByStudent = recipients.GroupBy(x => x.StudentUserId)
            .ToDictionary(x => x.Key, x => x.ToArray());
        var assignmentObjectivesByRecipient = recipients.ToDictionary(
            recipient => recipient.Id,
            recipient => assessmentById.TryGetValue(recipient.AssessmentId, out var assessment)
                ? assessment.Questions.Where(question => !question.IsDeleted).Select(question => question.ObjectiveId).Distinct().ToHashSet()
                : []);

        var publishedRecipientIds = recipients.Where(recipient =>
                assignmentById.TryGetValue(recipient.AssignmentId, out var assignment) && assignment.ResultsPublishedAt is not null)
            .Select(x => x.Id).ToArray();
        var attempts = await db.EducationAssessmentAttempts.AsNoTracking().Include(x => x.Responses)
            .Where(x => publishedRecipientIds.Contains(x.RecipientId) && x.Status == EducationAssessmentAttemptStatuses.Submitted &&
                x.SubmittedAt >= windowStart && x.SubmittedAt <= generatedAt && !x.IsDeleted)
            .ToListAsync(ct);
        var attemptIds = attempts.Select(x => x.Id).ToArray();
        var correctedAttemptIds = await db.EducationGradeRevisions.AsNoTracking()
            .Where(x => attemptIds.Contains(x.AttemptId) && !x.IsDeleted)
            .Select(x => x.AttemptId).Distinct().ToArrayAsync(ct);
        var correctedAttempts = correctedAttemptIds.ToHashSet(StringComparer.Ordinal);
        var previouslyAssessed = await (
            from attempt in db.EducationAssessmentAttempts.AsNoTracking()
            join recipient in db.EducationAssignmentRecipients.AsNoTracking() on attempt.RecipientId equals recipient.Id
            join assignment in db.EducationAssignments.AsNoTracking() on recipient.AssignmentId equals assignment.Id
            join response in db.EducationAssessmentResponses.AsNoTracking() on attempt.Id equals response.AttemptId
            join question in db.EducationQuestions.AsNoTracking() on response.QuestionId equals question.Id
            where assignmentIds.Contains(assignment.Id) && assignment.ResultsPublishedAt != null &&
                attempt.Status == EducationAssessmentAttemptStatuses.Submitted && attempt.SubmittedAt < windowStart &&
                !attempt.IsDeleted && !recipient.IsDeleted && !assignment.IsDeleted && !response.IsDeleted &&
                response.Score != null && !question.IsDeleted &&
                !db.EducationGradeRevisions.Any(revision => revision.AttemptId == attempt.Id && !revision.IsDeleted)
            select new { attempt.StudentUserId, question.ObjectiveId }
        ).Distinct().ToListAsync(ct);
        var previouslyAssessedPairs = previouslyAssessed
            .Select(x => (x.StudentUserId, x.ObjectiveId)).ToHashSet();

        // Build the evidence index once. The classroom grid can contain many students and
        // objectives, so scanning every attempt/response for each cell scales poorly.
        var evidenceByStudentAndObjective = new Dictionary<(string StudentId, string ObjectiveId), List<EducationObjectiveEvidenceDto>>();
        foreach (var attempt in attempts)
        {
            if (correctedAttempts.Contains(attempt.Id) ||
                !recipientById.TryGetValue(attempt.RecipientId, out var recipient) ||
                recipient.StudentUserId != attempt.StudentUserId ||
                recipient.AssessmentId != attempt.AssessmentId ||
                !assignmentById.TryGetValue(recipient.AssignmentId, out var assignment) ||
                !assessmentById.TryGetValue(attempt.AssessmentId, out var assessment) ||
                assessment.Version != attempt.AssessmentVersion)
                continue;

            foreach (var response in attempt.Responses)
            {
                if (response.IsDeleted || !response.Score.HasValue ||
                    !questionById.TryGetValue(response.QuestionId, out var mapped) ||
                    mapped.Assessment.Id != attempt.AssessmentId)
                    continue;

                var key = (attempt.StudentUserId, mapped.Question.ObjectiveId);
                if (!evidenceByStudentAndObjective.TryGetValue(key, out var evidence))
                    evidenceByStudentAndObjective[key] = evidence = [];

                evidence.Add(new EducationObjectiveEvidenceDto(
                    assessment.Id, assessment.Title, assignment.Title,
                    mapped.Question.Id, mapped.Question.Prompt, mapped.Question.Type,
                    attempt.SubmittedAt!.Value, response.Score.Value, mapped.Question.MaxScore));
            }
        }

        var students = memberships.Where(studentNames.ContainsKey)
            .OrderBy(studentId => studentNames[studentId], StringComparer.OrdinalIgnoreCase)
            .Select(studentId =>
            {
                var studentRecipients = recipientsByStudent.GetValueOrDefault(studentId) ?? [];
                var assignedObjectiveIds = studentRecipients
                    .SelectMany(recipient => assignmentObjectivesByRecipient.GetValueOrDefault(recipient.Id) ?? [])
                    .Where(objectives.ContainsKey).Distinct().ToArray();

                var progress = assignedObjectiveIds.Select(objectiveId =>
                {
                    var evidence = (evidenceByStudentAndObjective.GetValueOrDefault((studentId, objectiveId)) ?? [])
                      .GroupBy(x => new { x.AssessmentId, x.QuestionId })
                      .Select(group => group.OrderBy(x => x.SubmittedAt).First())
                      .OrderBy(x => x.SubmittedAt).ToArray();

                    var performance = EducationQuestionTypePerformanceCalculator.Calculate(evidence.Select(x =>
                        new EducationScoredQuestionEvidence(x.AssessmentId, x.QuestionId, x.QuestionType,
                            x.SubmittedAt, x.Score, x.MaxScore)));
                    var selectedResponse = performance.SelectedResponse;
                    var openResponse = performance.OpenResponse;
                    var status = evidence.Length == 0
                        ? previouslyAssessedPairs.Contains((studentId, objectiveId))
                            ? EducationMasteryStatuses.NeedsRevalidation
                            : EducationMasteryStatuses.InsufficientEvidence
                        : openResponse.DistinctQuestionCount == 0
                            ? EducationMasteryStatuses.SelectedResponseOnly
                            : EducationMasteryCalculator.GetStatus(new(
                                openResponse.Score!.Value, openResponse.MaxScore!.Value,
                                openResponse.DistinctQuestionCount, openResponse.DistinctAssessmentCount,
                                openResponse.DistinctSubmissionDateCount));
                    var objective = objectives[objectiveId];
                    return new EducationObjectiveMasteryDto(
                        objective.Id, objective.Title, objective.CourseId, objective.Course?.Title ?? string.Empty,
                        status,
                        openResponse.Score, openResponse.MaxScore, openResponse.Percentage,
                        openResponse.DistinctQuestionCount, openResponse.DistinctAssessmentCount,
                        openResponse.DistinctSubmissionDateCount,
                        selectedResponse, openResponse, evidence);
                }).OrderBy(x => x.CourseTitle, StringComparer.OrdinalIgnoreCase)
                  .ThenBy(x => x.ObjectiveTitle, StringComparer.OrdinalIgnoreCase).ToArray();

                return new EducationStudentObjectiveProgressDto(studentId, studentNames[studentId], progress);
            }).ToArray();

        return ApiResponse<EducationClassroomObjectiveProgressDto>.Ok(
            new(q.ClassroomId, windowStart, generatedAt, students));
    }

}
