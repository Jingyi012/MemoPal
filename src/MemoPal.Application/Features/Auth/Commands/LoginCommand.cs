using Mapster;
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

public sealed record LoginCommand(string Email, string Password) : IRequest<ApiResponse<AuthResponseDto>>;

public sealed class LoginCommandHandler : IRequestHandler<LoginCommand, ApiResponse<AuthResponseDto>>
{
    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _tokenGenerator;

    public LoginCommandHandler(IAppDbContext db, IPasswordHasher passwordHasher, IJwtTokenGenerator tokenGenerator)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<ApiResponse<AuthResponseDto>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var loginMethods = await _db.GetAuthLoginMethodsAsync(cancellationToken);
        if (!loginMethods.EmailPassword)
        {
            throw new ValidationAppException("Email and password login is currently disabled.");
        }

        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            throw new ValidationAppException("email and password are required.");
        }

        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == email && !x.IsDeleted, cancellationToken);
        if (user is null)
        {
            throw new UnauthorizedAppException("Invalid email or password.");
        }

        var identities = await _db.UserAuthIdentities
            .Where(x => x.UserId == user.Id && !x.IsDeleted)
            .ToListAsync(cancellationToken);
        var passwordIdentity = identities.FirstOrDefault(x => x.Provider == AuthProviders.Password);

        if (passwordIdentity is null)
        {
            // Backfill identity for legacy password users created before UserAuthIdentity existed.
            if (identities.Count == 0)
            {
                passwordIdentity = new UserAuthIdentity
                {
                    Id = Guid.NewGuid().ToString("D"),
                    UserId = user.Id,
                    Provider = AuthProviders.Password,
                    ProviderUserId = user.Id,
                    ProviderEmail = user.Email,
                    LastSignInAt = DateTime.UtcNow
                };
                await _db.UserAuthIdentities.AddAsync(passwordIdentity, cancellationToken);
                await _db.SaveChangesAsync(cancellationToken);
            }
            else
            {
                throw new UnauthorizedAppException("This account does not support password login. Use your linked sign-in method.");
            }
        }

        if (!_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAppException("Invalid email or password.");
        }

        passwordIdentity.LastSignInAt = DateTime.UtcNow;
        passwordIdentity.ProviderEmail = user.Email;
        await _db.EnsureUserLevelMatchesXpAsync(user, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        var stats = await _db.UserStats.FirstOrDefaultAsync(x => x.UserId == user.Id, cancellationToken);
        var token = _tokenGenerator.GenerateToken(user.Id, user.Email, user.Role);
        var result = new AuthResponseDto(token, (user, stats).Adapt<UserWithStatDto>());
        return ApiResponse<AuthResponseDto>.Ok(result);
    }
}
