using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Assignments.DTOs;
using MemoPal.Application.Features.Education.Relationships;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Assignments.Commands;

public sealed record CreateEducationRetakeCommand(
    string UserId,
    string AssignmentId,
    CreateEducationRetakeRequest Request)
    : IRequest<ApiResponse<EducationAssignmentDto>>;

public sealed class CreateEducationRetakeHandler(IAppDbContext db, EducationAccess access)
    : IRequestHandler<CreateEducationRetakeCommand, ApiResponse<EducationAssignmentDto>>
{
    public async Task<ApiResponse<EducationAssignmentDto>> Handle(CreateEducationRetakeCommand command, CancellationToken ct)
    {
        var original = await db.EducationAssignments.Include(x => x.Recipients)
            .FirstOrDefaultAsync(x => x.Id == command.AssignmentId && x.CreatorUserId == command.UserId &&
                x.Scope == EducationAssignmentScopes.Classroom && x.ClassroomId != null && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("Assignment not found.");
        if (!await access.IsActiveClassTeacherAsync(command.UserId, original.ClassroomId!, ct))
            throw new NotFoundAppException("Assignment not found.");
        if (original.RetakeOfAssignmentId is not null)
            throw new ConflictAppException("A retake assignment cannot itself authorize another retake.");
        if (!original.ResultsPublishedAt.HasValue)
            throw new ConflictAppException("Publish the original assignment results before authorizing a retake.");

        var studentId = command.Request.StudentUserId?.Trim();
        var reason = command.Request.Reason?.Trim();
        if (string.IsNullOrWhiteSpace(studentId) || reason is null || reason.Length is 0 or > 500)
            throw new ValidationAppException("A student and a reason of at most 500 characters are required.");
        var title = $"Retake: {original.Title}";
        if (title.Length > 200) title = title[..200];
        var values = AssignmentValidation.Validate(title,
            command.Request.OpensAt, command.Request.DueAt, command.Request.TimeLimitMinutes,
            command.Request.IdempotencyKey);
        if (!original.Recipients.Any(x => x.StudentUserId == studentId && !x.IsDeleted))
            throw new ValidationAppException("The selected student was not assigned the original work.");

        var activeStudent = await db.EducationMemberships.AnyAsync(x => x.ClassroomId == original.ClassroomId &&
            x.UserId == studentId && x.Role == EducationMembershipRoles.Student &&
            x.Status == EducationRelationshipStatuses.Active && !x.IsDeleted, ct);
        if (!activeStudent)
            throw new ConflictAppException("The student is no longer an active classroom member.");

        var originalRecipient = original.Recipients.Single(x => x.StudentUserId == studentId && !x.IsDeleted);
        var attempt = await db.EducationAssessmentAttempts.AsNoTracking()
            .Where(x => x.RecipientId == originalRecipient.Id && !x.IsDeleted)
            .OrderByDescending(x => x.SubmittedAt)
            .FirstOrDefaultAsync(ct);
        if (attempt is null || attempt.Status != EducationAssessmentAttemptStatuses.Submitted || attempt.Score is null)
            throw new ConflictAppException("Only a submitted, fully graded result can receive an authorized retake.");

        var assessment = await AssignmentValidation.PublishedAssessmentAsync(db, command.UserId, original.AssessmentId, ct);
        if (assessment.Version != original.AssessmentVersion)
            throw new ConflictAppException("The original assessment version is no longer available for a retake.");

        var existing = await db.EducationAssignments.Include(x => x.Recipients)
            .FirstOrDefaultAsync(x => x.CreatorUserId == command.UserId && x.IdempotencyKey == values.Key && !x.IsDeleted, ct);
        if (existing is not null)
            return ApiResponse<EducationAssignmentDto>.Ok(EnsureSameRequest(existing, original, studentId, reason,
                values, command.Request.TimeLimitMinutes));

        var retake = AssignmentValidation.Create(command.UserId, EducationAssignmentScopes.Classroom,
            original.ClassroomId, assessment, values.Title, values.OpensAt, values.DueAt,
            command.Request.TimeLimitMinutes, values.Key, [studentId], retakeOfAssignmentId: original.Id, retakeReason: reason);
        db.EducationAssignments.Add(retake);
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            db.ClearTracking();
            var retry = await db.EducationAssignments.AsNoTracking().Include(x => x.Recipients)
                .FirstOrDefaultAsync(x => x.CreatorUserId == command.UserId && x.IdempotencyKey == values.Key && !x.IsDeleted, ct);
            if (retry is null) throw;
            return ApiResponse<EducationAssignmentDto>.Ok(EnsureSameRequest(retry, original, studentId, reason,
                values, command.Request.TimeLimitMinutes));
        }

        return ApiResponse<EducationAssignmentDto>.Ok(AssignmentValidation.ToDto(retake));
    }

    private static EducationAssignmentDto EnsureSameRequest(
        EducationAssignment existing,
        EducationAssignment original,
        string studentId,
        string reason,
        (string Title, DateTime OpensAt, DateTime DueAt, string Key) values,
        int? timeLimitMinutes)
    {
        var recipientIds = existing.Recipients.Select(x => x.StudentUserId).ToArray();
        if (existing.RetakeOfAssignmentId != original.Id || existing.RetakeReason != reason ||
            existing.Scope != EducationAssignmentScopes.Classroom || existing.ClassroomId != original.ClassroomId ||
            existing.AssessmentId != original.AssessmentId || existing.AssessmentVersion != original.AssessmentVersion ||
            existing.Title != values.Title || existing.OpensAt != values.OpensAt || existing.DueAt != values.DueAt ||
            existing.TimeLimitMinutes != timeLimitMinutes ||
            !recipientIds.SequenceEqual([studentId], StringComparer.Ordinal) || existing.StudentLeaderboardEnabled)
            throw new ConflictAppException("This idempotency key was already used for a different assignment.");
        return AssignmentValidation.ToDto(existing);
    }
}
