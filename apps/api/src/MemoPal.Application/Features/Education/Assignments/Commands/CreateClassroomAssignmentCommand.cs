using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Assignments.DTOs;
using MemoPal.Application.Features.Education.Relationships;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Assignments.Commands;

public sealed record CreateClassroomAssignmentCommand(string UserId, string ClassroomId, CreateClassroomAssignmentRequest Request)
    : IRequest<ApiResponse<EducationAssignmentDto>>;

public sealed class CreateClassroomAssignmentHandler(IAppDbContext db, EducationAccess access)
    : IRequestHandler<CreateClassroomAssignmentCommand, ApiResponse<EducationAssignmentDto>>
{
    public async Task<ApiResponse<EducationAssignmentDto>> Handle(CreateClassroomAssignmentCommand q, CancellationToken ct)
    {
        var values = AssignmentValidation.Validate(q.Request.Title, q.Request.OpensAt, q.Request.DueAt,
            q.Request.TimeLimitMinutes, q.Request.IdempotencyKey);
        var targets = AssignmentValidation.NormalizeStudentIds(q.Request.StudentUserIds);
        if (!await access.IsActiveClassTeacherAsync(q.UserId, q.ClassroomId, ct))
            throw new NotFoundAppException("Classroom not found.");
        var activeStudents = await db.EducationMemberships.AsNoTracking()
            .Where(x => x.ClassroomId == q.ClassroomId && x.Role == EducationMembershipRoles.Student &&
                x.Status == EducationRelationshipStatuses.Active && !x.IsDeleted && targets.Contains(x.UserId))
            .Select(x => x.UserId).Distinct().ToListAsync(ct);
        if (activeStudents.Count != targets.Length)
            throw new ValidationAppException("Every recipient must be an active student in this classroom.");
        var assessment = await AssignmentValidation.PublishedAssessmentAsync(db, q.UserId, q.Request.AssessmentId, ct);
        var existing = await db.EducationAssignments.Include(x => x.Recipients)
            .FirstOrDefaultAsync(x => x.CreatorUserId == q.UserId && x.IdempotencyKey == values.Key && !x.IsDeleted, ct);
        if (existing is not null)
        {
            if (!AssignmentValidation.Matches(existing, EducationAssignmentScopes.Classroom, q.ClassroomId,
                assessment.Id, assessment.Version, values.Title, values.OpensAt, values.DueAt,
                q.Request.TimeLimitMinutes, targets, q.Request.EnableStudentLeaderboard))
                throw new ConflictAppException("This idempotency key was already used for a different assignment.");
            return ApiResponse<EducationAssignmentDto>.Ok(AssignmentValidation.ToDto(existing));
        }
        var assignment = AssignmentValidation.Create(q.UserId, EducationAssignmentScopes.Classroom, q.ClassroomId,
            assessment, values.Title, values.OpensAt, values.DueAt, q.Request.TimeLimitMinutes, values.Key, targets,
            q.Request.EnableStudentLeaderboard);
        db.EducationAssignments.Add(assignment);
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateException)
        {
            db.ClearTracking();
            var retry = await db.EducationAssignments.AsNoTracking().Include(x => x.Recipients)
                .FirstOrDefaultAsync(x => x.CreatorUserId == q.UserId && x.IdempotencyKey == values.Key && !x.IsDeleted, ct);
            if (retry is null) throw;
            if (!AssignmentValidation.Matches(retry, EducationAssignmentScopes.Classroom, q.ClassroomId,
                assessment.Id, assessment.Version, values.Title, values.OpensAt, values.DueAt,
                q.Request.TimeLimitMinutes, targets, q.Request.EnableStudentLeaderboard))
                throw new ConflictAppException("This idempotency key was already used for a different assignment.");
            return ApiResponse<EducationAssignmentDto>.Ok(AssignmentValidation.ToDto(retry));
        }
        return ApiResponse<EducationAssignmentDto>.Ok(AssignmentValidation.ToDto(assignment));
    }
}
