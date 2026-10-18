using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Relationships;

public sealed record RevokeGuardianLinkCommand(string UserId, string LinkId) : IRequest<ApiResponse<bool>>;

public sealed class RevokeGuardianLinkHandler(IAppDbContext db)
    : IRequestHandler<RevokeGuardianLinkCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(RevokeGuardianLinkCommand command, CancellationToken ct)
    {
        var link = await db.EducationGuardianLinks.FirstOrDefaultAsync(
            x => x.Id == command.LinkId && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("Guardian link not found.");
        if (link.GuardianUserId != command.UserId && link.StudentUserId != command.UserId)
            throw new AppException("Guardian link access required.", 403);

        if (link.Status != EducationRelationshipStatuses.Revoked)
        {
            link.Status = EducationRelationshipStatuses.Revoked;
            await db.SaveChangesAsync(ct);
        }

        return ApiResponse<bool>.Ok(true);
    }
}
