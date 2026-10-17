using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Companion.DTOs;
using MemoPal.Application.Features.Companion.Queries;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Companion.Commands;

public sealed record SelectCompanionCommand(string UserId, string AvatarId) : IRequest<ApiResponse<CompanionDto>>;

public sealed class SelectCompanionCommandHandler(IAppDbContext db)
    : IRequestHandler<SelectCompanionCommand, ApiResponse<CompanionDto>>
{
    public async Task<ApiResponse<CompanionDto>> Handle(SelectCompanionCommand request, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(x => x.Id == request.UserId && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("User not found.");
        var avatar = await db.AvatarDefinitions.FirstOrDefaultAsync(x => x.Id == request.AvatarId &&
            x.IsActive && !x.IsDeleted && x.RequiredLevel <= user.Level, ct)
            ?? throw new ValidationAppException("This companion is unavailable or still locked.");
        user.CompanionAvatarId = avatar.Id;
        await db.SaveChangesAsync(ct);
        return await new GetCompanionQueryHandler(db).Handle(new(user.Id), ct);
    }
}
