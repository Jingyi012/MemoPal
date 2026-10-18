using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Relationships.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Relationships;

public sealed record AcceptClassroomInvitationCommand(string UserId, string MembershipId)
    : IRequest<ApiResponse<EducationMembershipDto>>;

public sealed class AcceptClassroomInvitationHandler(IAppDbContext db)
    : IRequestHandler<AcceptClassroomInvitationCommand, ApiResponse<EducationMembershipDto>>
{
    public async Task<ApiResponse<EducationMembershipDto>> Handle(AcceptClassroomInvitationCommand command, CancellationToken ct)
    {
        var membership = await db.EducationMemberships.FirstOrDefaultAsync(
            m => m.Id == command.MembershipId && m.UserId == command.UserId && !m.IsDeleted, ct)
            ?? throw new NotFoundAppException("Invitation not found.");

        if (membership.Status == EducationRelationshipStatuses.Active)
            return ApiResponse<EducationMembershipDto>.Ok(await MapWithClassroomNameAsync(membership, ct));
        if (membership.Status != EducationRelationshipStatuses.Pending)
            throw new ConflictAppException("Invitation is no longer pending.");
        if (membership.ExpiresAt <= DateTime.UtcNow)
            throw new ConflictAppException("Invitation has expired.");

        membership.Status = EducationRelationshipStatuses.Active;
        membership.AcceptedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return ApiResponse<EducationMembershipDto>.Ok(await MapWithClassroomNameAsync(membership, ct));
    }

    private async Task<EducationMembershipDto> MapWithClassroomNameAsync(EducationMembership membership, CancellationToken ct)
    {
        var classroomName = await db.EducationClassrooms.AsNoTracking()
            .Where(c => c.Id == membership.ClassroomId && !c.IsDeleted)
            .Select(c => c.Name)
            .FirstOrDefaultAsync(ct);
        return EducationRelationshipMappings.ToDto(membership, classroomName);
    }
}
