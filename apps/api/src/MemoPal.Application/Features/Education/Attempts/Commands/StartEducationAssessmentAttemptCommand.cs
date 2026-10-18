using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Attempts.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Attempts.Commands;

public sealed record StartEducationAssessmentAttemptCommand(string UserId, string AssignmentId)
    : IRequest<ApiResponse<EducationAssessmentAttemptDto>>;

public sealed class StartEducationAssessmentAttemptHandler(IAppDbContext db)
    : IRequestHandler<StartEducationAssessmentAttemptCommand, ApiResponse<EducationAssessmentAttemptDto>>
{
    public async Task<ApiResponse<EducationAssessmentAttemptDto>> Handle(StartEducationAssessmentAttemptCommand q, CancellationToken ct)
    {
        var recipient = await db.EducationAssignmentRecipients.Include(x => x.Assignment)
            .FirstOrDefaultAsync(x => x.AssignmentId == q.AssignmentId && x.StudentUserId == q.UserId &&
                !x.IsDeleted && x.Assignment != null && !x.Assignment.IsDeleted, ct)
            ?? throw new NotFoundAppException("Assigned task not found.");
        var assessment = await EducationAttemptValidation.PublishedSnapshotAsync(db, recipient, ct);
        var existing = await db.EducationAssessmentAttempts.Include(x => x.Responses)
            .Include(x => x.Recipient).ThenInclude(x => x!.Assignment)
            .FirstOrDefaultAsync(x => x.RecipientId == recipient.Id && x.StudentUserId == q.UserId && !x.IsDeleted, ct);
        if (existing is not null)
            return ApiResponse<EducationAssessmentAttemptDto>.Ok(EducationAttemptMapping.ToDto(existing, assessment));

        var now = DateTime.UtcNow;
        if (now < recipient.OpensAt || now >= recipient.DueAt)
            throw new ConflictAppException("This assignment is not open for starting an attempt.");
        var attempt = EducationAssessmentAttempt.Start(recipient, now);
        db.EducationAssessmentAttempts.Add(attempt);
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateException)
        {
            db.ClearTracking();
            var retry = await db.EducationAssessmentAttempts.Include(x => x.Responses)
                .Include(x => x.Recipient).ThenInclude(x => x!.Assignment)
                .FirstOrDefaultAsync(x => x.RecipientId == recipient.Id && x.StudentUserId == q.UserId && !x.IsDeleted, ct);
            if (retry is null) throw;
            assessment = await EducationAttemptValidation.PublishedSnapshotAsync(db, retry, ct);
            return ApiResponse<EducationAssessmentAttemptDto>.Ok(EducationAttemptMapping.ToDto(retry, assessment));
        }
        return ApiResponse<EducationAssessmentAttemptDto>.Ok(EducationAttemptMapping.ToDto(attempt, assessment));
    }
}
