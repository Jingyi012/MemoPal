using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Relationships.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Relationships;

public sealed record InviteClassroomMemberCommand(string UserId, string ClassroomId, InviteClassroomMemberRequest Request)
    : IRequest<ApiResponse<EducationMembershipDto>>;

public sealed class InviteClassroomMemberHandler(IAppDbContext db)
    : IRequestHandler<InviteClassroomMemberCommand, ApiResponse<EducationMembershipDto>>
{
    public async Task<ApiResponse<EducationMembershipDto>> Handle(InviteClassroomMemberCommand command, CancellationToken ct)
    {
        if (command.Request.UserId == command.UserId)
            throw new ValidationAppException("You cannot invite yourself to a classroom.");

        var role = command.Request.Role?.Trim().ToLowerInvariant();
        if (role is not (EducationMembershipRoles.Student or EducationMembershipRoles.Teacher))
            throw new ValidationAppException("Role must be student or teacher.");

        var classroom = await db.EducationClassrooms.FirstOrDefaultAsync(
            c => c.Id == command.ClassroomId && c.OwnerUserId == command.UserId && !c.IsDeleted, ct)
            ?? throw new NotFoundAppException("Classroom not found.");

        if (!await db.Users.AnyAsync(user => user.Id == command.Request.UserId && !user.IsDeleted, ct))
            throw new NotFoundAppException("User not found.");

        if (await db.EducationMemberships.AnyAsync(
                m => m.ClassroomId == classroom.Id && m.UserId == command.Request.UserId && !m.IsDeleted, ct))
            throw new ConflictAppException("A membership already exists for this user and classroom.");

        var membership = new EducationMembership
        {
            Id = Guid.NewGuid().ToString("D"),
            ClassroomId = classroom.Id,
            UserId = command.Request.UserId,
            Role = role,
            Status = EducationRelationshipStatuses.Pending,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        db.EducationMemberships.Add(membership);
        await db.SaveChangesAsync(ct);

        return ApiResponse<EducationMembershipDto>.Ok(
            EducationRelationshipMappings.ToDto(membership, classroom.Name));
    }
}
