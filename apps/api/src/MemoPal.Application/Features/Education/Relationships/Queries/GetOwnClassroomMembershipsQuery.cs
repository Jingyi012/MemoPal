using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Relationships.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Relationships;

public sealed record GetOwnClassroomMembershipsQuery(string UserId) : IRequest<ApiResponse<IReadOnlyList<EducationMembershipDto>>>;

public sealed class GetOwnClassroomMembershipsHandler(IAppDbContext db)
    : IRequestHandler<GetOwnClassroomMembershipsQuery, ApiResponse<IReadOnlyList<EducationMembershipDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<EducationMembershipDto>>> Handle(GetOwnClassroomMembershipsQuery query, CancellationToken ct)
    {
        var rows = await db.EducationMemberships.AsNoTracking()
            .Where(m => m.UserId == query.UserId && !m.IsDeleted)
            .OrderByDescending(m => m.CreatedAt)
            .Select(m => new EducationMembershipDto(
                m.Id, m.ClassroomId, m.UserId, m.Role, m.Status, m.ExpiresAt, m.AcceptedAt,
                db.EducationClassrooms.Where(c => c.Id == m.ClassroomId && !c.IsDeleted).Select(c => c.Name).FirstOrDefault()))
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<EducationMembershipDto>>.Ok(rows);
    }
}
