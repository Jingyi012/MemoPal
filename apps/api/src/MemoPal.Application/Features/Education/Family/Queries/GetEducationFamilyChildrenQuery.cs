using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Family.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Family.Queries;

public sealed record GetEducationFamilyChildrenQuery(string GuardianUserId)
    : IRequest<ApiResponse<IReadOnlyList<EducationFamilyChildDto>>>;

public sealed class GetEducationFamilyChildrenHandler(IAppDbContext db)
    : IRequestHandler<GetEducationFamilyChildrenQuery, ApiResponse<IReadOnlyList<EducationFamilyChildDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<EducationFamilyChildDto>>> Handle(GetEducationFamilyChildrenQuery q, CancellationToken ct)
    {
        var links = await db.EducationGuardianLinks.AsNoTracking()
            .Where(x => x.GuardianUserId == q.GuardianUserId && x.Status == EducationRelationshipStatuses.Active &&
                x.StudentConfirmedAt != null && x.AdminVerifiedAt != null && !x.IsDeleted)
            .OrderBy(x => x.CreatedAt)
            .Select(x => new { x.StudentUserId, x.CreatedAt })
            .ToListAsync(ct);
        var studentIds = links.Select(x => x.StudentUserId).Distinct().ToArray();
        var names = await db.Users.AsNoTracking().Where(x => studentIds.Contains(x.Id) && !x.IsDeleted)
            .ToDictionaryAsync(x => x.Id, x => x.DisplayName, ct);
        var children = links.Where(x => names.ContainsKey(x.StudentUserId))
            .GroupBy(x => x.StudentUserId, StringComparer.Ordinal)
            .Select(group => new EducationFamilyChildDto(group.Key, names[group.Key], group.Min(x => x.CreatedAt)))
            .OrderBy(x => x.StudentName, StringComparer.OrdinalIgnoreCase)
            .ToArray();
        return ApiResponse<IReadOnlyList<EducationFamilyChildDto>>.Ok(children);
    }
}
