using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Relationships.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Relationships;

public sealed record VerifyGuardianLinkCommand(string AdminUserId, string LinkId)
    : IRequest<ApiResponse<EducationGuardianLinkDto>>;

public sealed class VerifyGuardianLinkHandler(IAppDbContext db)
    : IRequestHandler<VerifyGuardianLinkCommand, ApiResponse<EducationGuardianLinkDto>>
{
    public async Task<ApiResponse<EducationGuardianLinkDto>> Handle(VerifyGuardianLinkCommand command, CancellationToken ct)
    {
        var link = await db.EducationGuardianLinks.FirstOrDefaultAsync(x => x.Id == command.LinkId && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("Guardian link not found.");
        if (link.Status == EducationRelationshipStatuses.Revoked)
            throw new ConflictAppException("Guardian link is revoked.");

        link.AdminVerifiedAt ??= DateTime.UtcNow;
        link.AdminVerifiedBy ??= command.AdminUserId;
        if (link.StudentConfirmedAt is not null)
            link.Status = EducationRelationshipStatuses.Active;

        await db.SaveChangesAsync(ct);
        return ApiResponse<EducationGuardianLinkDto>.Ok(EducationRelationshipMappings.ToDto(link));
    }
}
