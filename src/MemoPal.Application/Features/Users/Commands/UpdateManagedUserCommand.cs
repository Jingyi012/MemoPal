using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Users.DTOs;
using MemoPal.Domain.Common;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Users.Commands;

public sealed record UpdateManagedUserCommand(string UserId, ManagedUserUpsertRequest Request) : IRequest<ApiResponse<ManagedUserDto>>;

public sealed class UpdateManagedUserCommandHandler : IRequestHandler<UpdateManagedUserCommand, ApiResponse<ManagedUserDto>>
{
    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;

    public UpdateManagedUserCommandHandler(IAppDbContext db, IPasswordHasher passwordHasher)
    {
        _db = db;
        _passwordHasher = passwordHasher;
    }

    public async Task<ApiResponse<ManagedUserDto>> Handle(UpdateManagedUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == request.UserId, cancellationToken)
            ?? throw new NotFoundAppException("User not found.");

        if (!string.IsNullOrWhiteSpace(request.Request.DisplayName))
            user.DisplayName = request.Request.DisplayName.Trim();

        if (!string.IsNullOrWhiteSpace(request.Request.Email))
        {
            var email = request.Request.Email.Trim().ToLowerInvariant();
            var exists = await _db.Users.AnyAsync(x => x.Email == email && x.Id != user.Id, cancellationToken);
            if (exists)
                throw new ConflictAppException("Email already exists.");
            user.Email = email;
        }

        if (!string.IsNullOrWhiteSpace(request.Request.Password))
            user.PasswordHash = _passwordHasher.Hash(request.Request.Password);

        if (request.Request.AvatarUrl is not null)
            user.AvatarUrl = request.Request.AvatarUrl;

        if (request.Request.Role is not null)
            user.Role = NormalizeRole(request.Request.Role);

        if (request.Request.TotalXp.HasValue)
            user.TotalXp = request.Request.TotalXp.Value;

        if (request.Request.Level.HasValue && request.Request.Level.Value > 0)
            user.Level = request.Request.Level.Value;

        if (request.Request.IsPremium.HasValue)
            user.IsPremium = request.Request.IsPremium.Value;

        if (request.Request.IsDeleted.HasValue)
        {
            user.IsDeleted = request.Request.IsDeleted.Value;
            user.DeletedAt = user.IsDeleted ? DateTime.UtcNow : null;
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        return ApiResponse<ManagedUserDto>.Ok(user.Adapt<ManagedUserDto>());
    }

    private static string NormalizeRole(string? role)
    {
        if (string.Equals(role, UserRoles.Admin, StringComparison.OrdinalIgnoreCase))
            return UserRoles.Admin;

        return UserRoles.User;
    }
}
