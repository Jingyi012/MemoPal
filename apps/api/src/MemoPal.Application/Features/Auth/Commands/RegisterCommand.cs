using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Auth.DTOs;
using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Auth.Commands;

public sealed record RegisterCommand(
    string DisplayName,
    string Email,
    string Password,
    string? DeviceId = null,
    string? DeviceName = null) : IRequest<ApiResponse<AuthResponseDto>>;

public sealed class RegisterCommandHandler : IRequestHandler<RegisterCommand, ApiResponse<AuthResponseDto>>
{
    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _tokenGenerator;

    public RegisterCommandHandler(IAppDbContext db, IPasswordHasher passwordHasher, IJwtTokenGenerator tokenGenerator)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<ApiResponse<AuthResponseDto>> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var loginMethods = await _db.GetAuthLoginMethodsAsync(cancellationToken);
        if (!loginMethods.EmailPassword)
        {
            throw new ValidationAppException("Email and password registration is currently disabled.");
        }

        if (string.IsNullOrWhiteSpace(request.DisplayName) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            throw new ValidationAppException("displayName, email, and password are required.");
        }

        var email = request.Email.Trim().ToLowerInvariant();
        var existingUser = await _db.Users
            .FirstOrDefaultAsync(x => x.Email == email && !x.IsDeleted, cancellationToken);

        if (existingUser is not null)
        {
            var linkedProviders = await _db.UserAuthIdentities
                .AsNoTracking()
                .Where(x => x.UserId == existingUser.Id && !x.IsDeleted)
                .Select(x => x.Provider)
                .ToListAsync(cancellationToken);

            if (linkedProviders.Contains(AuthProviders.Google, StringComparer.Ordinal) ||
                linkedProviders.Contains(AuthProviders.Facebook, StringComparer.Ordinal))
            {
                throw new ConflictAppException("An account with this email already exists. Sign in with the linked provider and link password from account settings.");
            }

            throw new ConflictAppException("Email already exists.");
        }

        var now = DateTime.UtcNow;
        var user = new User
        {
            Id = Guid.NewGuid().ToString("D"),
            DisplayName = request.DisplayName.Trim(),
            Email = email,
            PasswordHash = _passwordHasher.Hash(request.Password),
            Role = UserRoles.User,
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
        await _db.UserAuthIdentities.AddAsync(
            new UserAuthIdentity
            {
                Id = Guid.NewGuid().ToString("D"),
                UserId = user.Id,
                Provider = AuthProviders.Password,
                ProviderUserId = user.Id,
                ProviderEmail = user.Email,
                LastSignInAt = now,
                CreatedAt = now,
                UpdatedAt = now
            },
            cancellationToken);
        await _db.UserStats.AddAsync(stats, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        var result = await AuthSessionManager.IssueAsync(
            _db,
            _tokenGenerator,
            user,
            stats,
            request.DeviceId,
            request.DeviceName,
            "replaced_on_login",
            cancellationToken);
        return ApiResponse<AuthResponseDto>.Ok(result);
    }
}
