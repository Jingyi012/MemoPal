using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Relationships;

public sealed record RevokeClassroomMembershipCommand(string UserId, string MembershipId) : IRequest<ApiResponse<bool>>;

public sealed class RevokeClassroomMembershipHandler(IAppDbContext db)
    : IRequestHandler<RevokeClassroomMembershipCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(RevokeClassroomMembershipCommand command, CancellationToken ct)
    {
        var membership = await db.EducationMemberships.FirstOrDefaultAsync(
            m => m.Id == command.MembershipId && !m.IsDeleted, ct)
            ?? throw new NotFoundAppException("Membership not found.");

        var isOwner = await db.EducationClassrooms.AnyAsync(
            c => c.Id == membership.ClassroomId && c.OwnerUserId == command.UserId && !c.IsDeleted, ct);
        if (!isOwner && membership.UserId != command.UserId)
            throw new AppException("Classroom owner or membership owner access required.", 403);

        if (membership.Status != EducationRelationshipStatuses.Revoked)
        {
            membership.Status = EducationRelationshipStatuses.Revoked;
            await db.SaveChangesAsync(ct);
        }

        return ApiResponse<bool>.Ok(true);
    }
}
