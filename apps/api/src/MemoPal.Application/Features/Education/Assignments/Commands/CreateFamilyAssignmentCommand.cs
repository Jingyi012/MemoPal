using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Assignments.DTOs;
using MemoPal.Application.Features.Education.Relationships;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Assignments.Commands;

public sealed record CreateFamilyAssignmentCommand(string UserId, CreateFamilyAssignmentRequest Request)
    : IRequest<ApiResponse<EducationAssignmentDto>>;

public sealed class CreateFamilyAssignmentHandler(IAppDbContext db, EducationAccess access)
    : IRequestHandler<CreateFamilyAssignmentCommand, ApiResponse<EducationAssignmentDto>>
{
    public async Task<ApiResponse<EducationAssignmentDto>> Handle(CreateFamilyAssignmentCommand q, CancellationToken ct)
    {
        var values = AssignmentValidation.Validate(q.Request.Title, q.Request.OpensAt, q.Request.DueAt,
            q.Request.TimeLimitMinutes, q.Request.IdempotencyKey);
        var targets = AssignmentValidation.NormalizeStudentIds(q.Request.StudentUserIds);
        foreach (var studentId in targets)
            if (!await access.IsVerifiedGuardianAsync(q.UserId, studentId, ct))
                throw new NotFoundAppException("Verified guardian relationship not found for a recipient.");
        var assessment = await AssignmentValidation.PublishedAssessmentAsync(db, q.UserId, q.Request.AssessmentId, ct);
        var existing = await db.EducationAssignments.Include(x => x.Recipients)
            .FirstOrDefaultAsync(x => x.CreatorUserId == q.UserId && x.IdempotencyKey == values.Key && !x.IsDeleted, ct);
        if (existing is not null)
        {
            if (!AssignmentValidation.Matches(existing, EducationAssignmentScopes.Family, null,
                assessment.Id, assessment.Version, values.Title, values.OpensAt, values.DueAt,
                q.Request.TimeLimitMinutes, targets))
                throw new ConflictAppException("This idempotency key was already used for a different assignment.");
            return ApiResponse<EducationAssignmentDto>.Ok(AssignmentValidation.ToDto(existing));
        }
        var assignment = AssignmentValidation.Create(q.UserId, EducationAssignmentScopes.Family, null,
            assessment, values.Title, values.OpensAt, values.DueAt, q.Request.TimeLimitMinutes, values.Key, targets);
        db.EducationAssignments.Add(assignment);
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateException)
        {
            db.ClearTracking();
            var retry = await db.EducationAssignments.AsNoTracking().Include(x => x.Recipients)
                .FirstOrDefaultAsync(x => x.CreatorUserId == q.UserId && x.IdempotencyKey == values.Key && !x.IsDeleted, ct);
            if (retry is null) throw;
            if (!AssignmentValidation.Matches(retry, EducationAssignmentScopes.Family, null,
                assessment.Id, assessment.Version, values.Title, values.OpensAt, values.DueAt,
                q.Request.TimeLimitMinutes, targets))
                throw new ConflictAppException("This idempotency key was already used for a different assignment.");
            return ApiResponse<EducationAssignmentDto>.Ok(AssignmentValidation.ToDto(retry));
        }
        return ApiResponse<EducationAssignmentDto>.Ok(AssignmentValidation.ToDto(assignment));
    }
}
