using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Assignments.DTOs;
using MemoPal.Application.Features.Education.Relationships;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Assignments.Commands;

public sealed record UpdateEducationLeaderboardPreferenceCommand(
    string UserId, string AssignmentId, UpdateEducationLeaderboardPreferenceRequest Request)
    : IRequest<ApiResponse<bool>>;

public sealed class UpdateEducationLeaderboardPreferenceHandler(IAppDbContext db, EducationAccess access)
    : IRequestHandler<UpdateEducationLeaderboardPreferenceCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(UpdateEducationLeaderboardPreferenceCommand q, CancellationToken ct)
    {
        var recipient = await db.EducationAssignmentRecipients
            .Include(x => x.Assignment)
            .FirstOrDefaultAsync(x => x.AssignmentId == q.AssignmentId && x.StudentUserId == q.UserId &&
                !x.IsDeleted && x.Assignment != null && !x.Assignment.IsDeleted, ct)
            ?? throw new NotFoundAppException("Assignment not found.");
        var assignment = recipient.Assignment!;
        if (assignment.Scope != EducationAssignmentScopes.Classroom || assignment.ClassroomId is null ||
            !await access.IsActiveClassStudentAsync(q.UserId, assignment.ClassroomId, ct))
            throw new NotFoundAppException("Assignment not found.");
        if (assignment.ResultsPublishedAt is not null)
            throw new ConflictAppException("Leaderboard preferences are locked after results are published.");
        if (q.Request.IncludeInLeaderboard && !assignment.StudentLeaderboardEnabled)
            throw new ConflictAppException("The teacher has not enabled the class leaderboard for this assignment.");

        recipient.IncludeInStudentLeaderboard = q.Request.IncludeInLeaderboard;
        await db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(recipient.IncludeInStudentLeaderboard);
    }
}
