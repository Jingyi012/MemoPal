using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Auth.DTOs;
using MemoPal.Application.Features.Users.DTOs;
using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Users.Commands;

public sealed record CreateManagedUserCommand(ManagedUserUpsertRequest Request) : IRequest<ApiResponse<ManagedUserDto>>;

public sealed class CreateManagedUserCommandHandler : IRequestHandler<CreateManagedUserCommand, ApiResponse<ManagedUserDto>>
{
    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;

    public CreateManagedUserCommandHandler(IAppDbContext db, IPasswordHasher passwordHasher)
    {
        _db = db;
        _passwordHasher = passwordHasher;
    }

    public async Task<ApiResponse<ManagedUserDto>> Handle(CreateManagedUserCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Request.DisplayName)
            || string.IsNullOrWhiteSpace(request.Request.Email)
            || string.IsNullOrWhiteSpace(request.Request.Password))
        {
            throw new ValidationAppException("displayName, email, and password are required.");
        }

        var email = request.Request.Email.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(x => x.Email == email, cancellationToken))
        {
            throw new ConflictAppException("Email already exists.");
        }

        var totalXp = Math.Max(0, request.Request.TotalXp ?? 0);
        var resolvedLevel = await _db.ResolveLevelByXpAsync(totalXp, cancellationToken);
        var now = DateTime.UtcNow;
        var user = new User
        {
            Id = Guid.NewGuid().ToString("D"),
            DisplayName = request.Request.DisplayName.Trim(),
            Email = email,
            PasswordHash = _passwordHasher.Hash(request.Request.Password),
            AvatarUrl = request.Request.AvatarUrl,
            Role = NormalizeRole(request.Request.Role),
            TotalXp = totalXp,
            Level = resolvedLevel,
            IsPremium = request.Request.IsPremium ?? false,
            IsDeleted = request.Request.IsDeleted ?? false,
            CreatedAt = now,
            UpdatedAt = now
        };

        var stats = new UserStats
        {
            UserId = user.Id,
            LastActiveDate = now,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _db.Users.AddAsync(user, cancellationToken);
        await _db.UserStats.AddAsync(stats, cancellationToken);
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
