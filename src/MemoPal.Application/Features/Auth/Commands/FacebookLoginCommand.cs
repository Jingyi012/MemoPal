using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Auth.DTOs;
using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Auth.Commands;

public sealed record FacebookLoginCommand(string FacebookAccessToken) : IRequest<ApiResponse<AuthResponseDto>>;

public sealed class FacebookLoginCommandHandler : IRequestHandler<FacebookLoginCommand, ApiResponse<AuthResponseDto>>
{
    private readonly IAppDbContext _db;
    private readonly IFacebookTokenValidator _facebookTokenValidator;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _tokenGenerator;

    public FacebookLoginCommandHandler(
        IAppDbContext db,
        IFacebookTokenValidator facebookTokenValidator,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator tokenGenerator)
    {
        _db = db;
        _facebookTokenValidator = facebookTokenValidator;
        _passwordHasher = passwordHasher;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<ApiResponse<AuthResponseDto>> Handle(FacebookLoginCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.FacebookAccessToken))
        {
            throw new ValidationAppException("facebookAccessToken is required.");
        }

        var profile = await _facebookTokenValidator.ValidateAccessTokenAsync(request.FacebookAccessToken, cancellationToken);
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

        var token = _tokenGenerator.GenerateToken(user.Id, user.Email, user.Role);
        return ApiResponse < AuthResponseDto > .Ok(new AuthResponseDto(token, (user, stats).Adapt<UserWithStatDto>()));
    }

    private async Task<User> ResolveUserAsync(ExternalAuthUserInfo profile, CancellationToken cancellationToken)
    {
        var normalizedEmail = NormalizeEmail(profile, "facebook");
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
            DisplayName = string.IsNullOrWhiteSpace(profile.DisplayName) ? "Facebook User" : profile.DisplayName,
            AvatarUrl = profile.AvatarUrl,
            PasswordHash = _passwordHasher.Hash(Guid.NewGuid().ToString("N")),
            Role = UserRoles.User,
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
