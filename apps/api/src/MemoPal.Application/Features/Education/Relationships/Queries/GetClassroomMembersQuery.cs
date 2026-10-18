using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Relationships.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Relationships;

public sealed record GetClassroomMembersQuery(string UserId, string ClassroomId) : IRequest<ApiResponse<IReadOnlyList<EducationMembershipDto>>>;

public sealed class GetClassroomMembersHandler(IAppDbContext db)
    : IRequestHandler<GetClassroomMembersQuery, ApiResponse<IReadOnlyList<EducationMembershipDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<EducationMembershipDto>>> Handle(GetClassroomMembersQuery query, CancellationToken ct)
    {
        var classroom = await db.EducationClassrooms.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == query.ClassroomId && !c.IsDeleted, ct)
            ?? throw new NotFoundAppException("Classroom not found.");

        var isOwner = classroom.OwnerUserId == query.UserId;
        var isActiveTeacher = await new EducationAccess(db).IsActiveClassTeacherAsync(query.UserId, query.ClassroomId, ct);
        if (!isOwner && !isActiveTeacher)
            throw new AppException("Classroom member access required.", 403);

        var rows = await db.EducationMemberships.AsNoTracking()
            .Where(m => m.ClassroomId == query.ClassroomId && !m.IsDeleted)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new EducationMembershipDto(
                m.Id, m.ClassroomId, m.UserId, m.Role, m.Status, m.ExpiresAt, m.AcceptedAt, classroom.Name,
                db.Users.Where(user => user.Id == m.UserId && !user.IsDeleted)
                    .Select(user => user.DisplayName).FirstOrDefault()))
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<EducationMembershipDto>>.Ok(rows);
    }
}
