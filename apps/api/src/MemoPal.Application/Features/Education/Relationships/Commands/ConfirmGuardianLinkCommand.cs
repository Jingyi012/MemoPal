using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Relationships.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Relationships;

public sealed record ConfirmGuardianLinkCommand(string UserId, string LinkId) : IRequest<ApiResponse<EducationGuardianLinkDto>>;

public sealed class ConfirmGuardianLinkHandler(IAppDbContext db)
    : IRequestHandler<ConfirmGuardianLinkCommand, ApiResponse<EducationGuardianLinkDto>>
{
    public async Task<ApiResponse<EducationGuardianLinkDto>> Handle(ConfirmGuardianLinkCommand command, CancellationToken ct)
    {
        var link = await db.EducationGuardianLinks.FirstOrDefaultAsync(
            x => x.Id == command.LinkId && x.StudentUserId == command.UserId && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("Guardian link not found.");
        if (link.Status == EducationRelationshipStatuses.Revoked)
            throw new ConflictAppException("Guardian link is revoked.");

        if (link.StudentConfirmedAt is null)
        {
            link.StudentConfirmedAt = DateTime.UtcNow;
            if (link.AdminVerifiedAt is not null)
                link.Status = EducationRelationshipStatuses.Active;
            await db.SaveChangesAsync(ct);
        }

        return ApiResponse<EducationGuardianLinkDto>.Ok(EducationRelationshipMappings.ToDto(link));
    }
}
