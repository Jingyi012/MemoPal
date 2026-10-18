using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Relationships.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Relationships;

public sealed record GetGuardianLinksQuery(string UserId) : IRequest<ApiResponse<IReadOnlyList<EducationGuardianLinkDto>>>;

public sealed class GetGuardianLinksHandler(IAppDbContext db)
    : IRequestHandler<GetGuardianLinksQuery, ApiResponse<IReadOnlyList<EducationGuardianLinkDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<EducationGuardianLinkDto>>> Handle(GetGuardianLinksQuery query, CancellationToken ct)
    {
        var rows = await db.EducationGuardianLinks.AsNoTracking()
            .Where(link => (link.GuardianUserId == query.UserId || link.StudentUserId == query.UserId) && !link.IsDeleted)
            .OrderByDescending(link => link.CreatedAt)
            .Select(link => new EducationGuardianLinkDto(
                link.Id, link.GuardianUserId, link.StudentUserId, link.Status,
                link.StudentConfirmedAt != null, link.AdminVerifiedAt != null, link.CreatedAt,
                db.Users.Where(user => user.Id == link.GuardianUserId && !user.IsDeleted)
                    .Select(user => user.DisplayName).FirstOrDefault(),
                db.Users.Where(user => user.Id == link.StudentUserId && !user.IsDeleted)
                    .Select(user => user.DisplayName).FirstOrDefault()))
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<EducationGuardianLinkDto>>.Ok(rows);
    }
}
