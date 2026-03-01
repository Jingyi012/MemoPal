using Mapster;
using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Auth.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Auth.Commands;

public sealed record GoogleLoginCommand(string GoogleAccessToken) : IRequest<AuthResponseDto>;

public sealed class GoogleLoginCommandHandler : IRequestHandler<GoogleLoginCommand, AuthResponseDto>
{
    private readonly IAppDbContext _db;
    private readonly IGoogleTokenValidator _googleTokenValidator;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _tokenGenerator;

    public GoogleLoginCommandHandler(
        IAppDbContext db,
        IGoogleTokenValidator googleTokenValidator,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator tokenGenerator)
    {
        _db = db;
        _googleTokenValidator = googleTokenValidator;
        _passwordHasher = passwordHasher;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<AuthResponseDto> Handle(GoogleLoginCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.GoogleAccessToken))
        {
            throw new ValidationAppException("googleAccessToken is required.");
        }

        var profile = await _googleTokenValidator.ValidateAccessTokenAsync(request.GoogleAccessToken, cancellationToken);
        var user = await ResolveUserAsync(profile, cancellationToken);

        var stats = await _db.UserStats.FirstOrDefaultAsync(x => x.UserId == user.Id, cancellationToken);
        if (stats is null)
        {
            stats = new UserStats
            {
                UserId = user.Id,
                LastActiveDate = DateTime.UtcNow
            };
            await _db.UserStats.AddAsync(stats, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
        }

        var token = _tokenGenerator.GenerateToken(user.Id, user.Email);
        return new AuthResponseDto(token, (user, stats).Adapt<UserWithStatDto>());
    }

    private async Task<User> ResolveUserAsync(ExternalAuthUserInfo profile, CancellationToken cancellationToken)
    {
        var normalizedEmail = NormalizeEmail(profile, "google");
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == normalizedEmail && !x.IsDeleted, cancellationToken);
        if (user is not null)
        {
            if (string.IsNullOrWhiteSpace(user.AvatarUrl) && !string.IsNullOrWhiteSpace(profile.AvatarUrl))
            {
                user.AvatarUrl = profile.AvatarUrl;
            }

            if (!string.IsNullOrWhiteSpace(profile.DisplayName) && user.DisplayName != profile.DisplayName)
            {
                user.DisplayName = profile.DisplayName;
            }

            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            return user;
        }

        user = new User
        {
            Id = Guid.NewGuid().ToString("D"),
            Email = normalizedEmail,
            DisplayName = string.IsNullOrWhiteSpace(profile.DisplayName) ? "Google User" : profile.DisplayName,
            AvatarUrl = profile.AvatarUrl,
            PasswordHash = _passwordHasher.Hash(Guid.NewGuid().ToString("N")),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _db.Users.AddAsync(user, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
        return user;
    }

    private static string NormalizeEmail(ExternalAuthUserInfo profile, string provider)
    {
        if (!string.IsNullOrWhiteSpace(profile.Email))
        {
            return profile.Email.Trim().ToLowerInvariant();
        }

        return $"{provider}.{profile.ProviderUserId}@memopal.local".ToLowerInvariant();
    }
}
