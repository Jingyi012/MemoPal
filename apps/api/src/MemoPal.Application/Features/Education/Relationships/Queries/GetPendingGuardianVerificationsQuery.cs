using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Relationships.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Relationships.Queries;

public sealed record GetPendingGuardianVerificationsQuery : IRequest<ApiResponse<IReadOnlyList<EducationGuardianLinkDto>>>;

public sealed class GetPendingGuardianVerificationsHandler(IAppDbContext db)
    : IRequestHandler<GetPendingGuardianVerificationsQuery, ApiResponse<IReadOnlyList<EducationGuardianLinkDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<EducationGuardianLinkDto>>> Handle(GetPendingGuardianVerificationsQuery query, CancellationToken ct)
    {
        var rows = await db.EducationGuardianLinks.AsNoTracking()
            .Where(x => x.Status == EducationRelationshipStatuses.Pending && x.StudentConfirmedAt != null && x.AdminVerifiedAt == null && !x.IsDeleted)
            .OrderBy(x => x.CreatedAt)
            .Select(x => new EducationGuardianLinkDto(x.Id, x.GuardianUserId, x.StudentUserId, x.Status,
                x.StudentConfirmedAt != null, false, x.CreatedAt,
                db.Users.Where(user => user.Id == x.GuardianUserId && !user.IsDeleted)
                    .Select(user => user.DisplayName).FirstOrDefault(),
                db.Users.Where(user => user.Id == x.StudentUserId && !user.IsDeleted)
                    .Select(user => user.DisplayName).FirstOrDefault()))
            .ToListAsync(ct);
        return ApiResponse<IReadOnlyList<EducationGuardianLinkDto>>.Ok(rows);
    }
}
