using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Relationships.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Relationships;

public sealed record GetClassroomsQuery(string UserId) : IRequest<ApiResponse<IReadOnlyList<EducationClassroomDto>>>;

public sealed class GetClassroomsHandler(IAppDbContext db)
    : IRequestHandler<GetClassroomsQuery, ApiResponse<IReadOnlyList<EducationClassroomDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<EducationClassroomDto>>> Handle(GetClassroomsQuery query, CancellationToken ct)
    {
        var activeMembershipClassIds = db.EducationMemberships
            .Where(m => m.UserId == query.UserId && !m.IsDeleted && m.Status == EducationRelationshipStatuses.Active)
            .Select(m => m.ClassroomId);

        var rows = await db.EducationClassrooms.AsNoTracking()
            .Where(c => !c.IsDeleted && (c.OwnerUserId == query.UserId || activeMembershipClassIds.Contains(c.Id)))
            .OrderBy(c => c.Name)
            .Select(c => new EducationClassroomDto(
                c.Id,
                c.Name,
                c.OwnerUserId == query.UserId
                    ? "owner"
                    : db.EducationMemberships
                        .Where(m => m.ClassroomId == c.Id && m.UserId == query.UserId && !m.IsDeleted && m.Status == EducationRelationshipStatuses.Active)
                        .Select(m => m.Role)
                        .FirstOrDefault() ?? EducationMembershipRoles.Student,
                c.CreatedAt))
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<EducationClassroomDto>>.Ok(rows);
    }
}
