using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Auth.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Auth.Commands;

public sealed record SelectAvatarCommand(string UserId, string? AvatarId) : IRequest<ApiResponse<UserWithStatDto>>;

public sealed class SelectAvatarCommandHandler : IRequestHandler<SelectAvatarCommand, ApiResponse<UserWithStatDto>>
{
    private readonly IAppDbContext _db;

    public SelectAvatarCommandHandler(IAppDbContext db) => _db = db;

    public async Task<ApiResponse<UserWithStatDto>> Handle(SelectAvatarCommand request, CancellationToken cancellationToken)
    {
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == request.UserId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("User not found.");

        if (!string.IsNullOrWhiteSpace(request.AvatarId))
        {
            var avatar = await _db.AvatarDefinitions.FirstOrDefaultAsync(
                x => x.Id == request.AvatarId && !x.IsDeleted && x.IsActive,
                cancellationToken);
            if (avatar is null)
                throw new NotFoundAppException("Avatar not found.");
            if (avatar.RequiredLevel > user.Level)
                throw new ValidationAppException($"Reach level {avatar.RequiredLevel} to unlock this avatar.");
            user.SelectedAvatarId = avatar.Id;
            user.AvatarSource = AvatarSources.Companion;
        }
        else
        {
            user.SelectedAvatarId = null;
            user.AvatarSource = AvatarSources.Companion;
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        var stats = await _db.UserStats.FirstOrDefaultAsync(x => x.UserId == user.Id, cancellationToken);
        return ApiResponse<UserWithStatDto>.Ok((user, stats).Adapt<UserWithStatDto>());
    }
}
