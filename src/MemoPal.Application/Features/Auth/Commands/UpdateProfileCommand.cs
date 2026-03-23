using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Auth.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Auth.Commands;

public sealed record UpdateProfileCommand(string UserId, string? DisplayName, string? AvatarUrl, string? Email) : IRequest<ApiResponse<UserWithStatDto>>;

public sealed class UpdateProfileCommandHandler : IRequestHandler<UpdateProfileCommand, ApiResponse<UserWithStatDto>>
{
    private readonly IAppDbContext _db;

    public UpdateProfileCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<UserWithStatDto>> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
    {
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == request.UserId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("User not found.");

        if (!string.IsNullOrWhiteSpace(request.DisplayName))
        {
            user.DisplayName = request.DisplayName.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.AvatarUrl))
        {
            user.AvatarUrl = request.AvatarUrl.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var normalized = request.Email.Trim().ToLowerInvariant();
            var existing = await _db.Users.FirstOrDefaultAsync(x => x.Email == normalized && x.Id != user.Id, cancellationToken);
            if (existing is not null)
            {
                throw new ConflictAppException("Email already exists.");
            }

            user.Email = normalized;
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        var stats = await _db.UserStats.FirstOrDefaultAsync(x => x.UserId == request.UserId, cancellationToken);
        return ApiResponse<UserWithStatDto>.Ok((user, stats).Adapt<UserWithStatDto>());
    }
}
