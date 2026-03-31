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

public sealed record FacebookLoginCommand(
    string FacebookAccessToken,
    string? DeviceId = null,
    string? DeviceName = null) : IRequest<ApiResponse<AuthResponseDto>>;

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
        var loginMethods = await _db.GetAuthLoginMethodsAsync(cancellationToken);
        if (!loginMethods.Facebook)
        {
            throw new ValidationAppException("Facebook login is currently disabled.");
        }

        if (string.IsNullOrWhiteSpace(request.FacebookAccessToken))
        {
            throw new ValidationAppException("facebookAccessToken is required.");
        }

        var profile = await _facebookTokenValidator.ValidateAccessTokenAsync(request.FacebookAccessToken, cancellationToken);
        var user = await ResolveUserAsync(profile, cancellationToken);
        var levelAdjusted = await _db.EnsureUserLevelMatchesXpAsync(user, cancellationToken);

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
        else if (levelAdjusted)
        {
            await _db.SaveChangesAsync(cancellationToken);
        }

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

    private async Task<User> ResolveUserAsync(ExternalAuthUserInfo profile, CancellationToken cancellationToken)
    {
        var providerUserId = NormalizeProviderUserId(profile.ProviderUserId, AuthProviders.Facebook);
        var normalizedEmail = NormalizeEmail(profile, providerUserId);

        var providerIdentity = await _db.UserAuthIdentities
            .FirstOrDefaultAsync(
                x => x.Provider == AuthProviders.Facebook &&
                     x.ProviderUserId == providerUserId &&
                     !x.IsDeleted,
                cancellationToken);

        if (providerIdentity is not null)
        {
            var linkedUser = await _db.Users
                .FirstOrDefaultAsync(x => x.Id == providerIdentity.UserId && !x.IsDeleted, cancellationToken)
                ?? throw new UnauthorizedAppException("Linked user account is unavailable.");

            ApplyUserProfile(linkedUser, profile);
            providerIdentity.ProviderEmail = profile.Email?.Trim().ToLowerInvariant();
            providerIdentity.LastSignInAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            return linkedUser;
        }

        User? existingUser = null;
        if (!string.IsNullOrWhiteSpace(profile.Email))
        {
            existingUser = await _db.Users
                .FirstOrDefaultAsync(x => x.Email == normalizedEmail && !x.IsDeleted, cancellationToken);
        }

        if (existingUser is not null)
        {
            var existingIdentities = await _db.UserAuthIdentities
                .Where(x => x.UserId == existingUser.Id && !x.IsDeleted)
                .ToListAsync(cancellationToken);

            if (existingIdentities.Count > 0)
            {
                throw new ConflictAppException("This email is already linked to a different sign-in method. Sign in with the existing method, then link Facebook from account settings.");
            }

            // Legacy account with no identities: backfill link once.
            _db.UserAuthIdentities.Add(CreateIdentity(existingUser.Id, AuthProviders.Facebook, providerUserId, profile.Email));
            ApplyUserProfile(existingUser, profile);
            await _db.SaveChangesAsync(cancellationToken);
            return existingUser;
        }

        var now = DateTime.UtcNow;
        var user = new User
        {
            Id = Guid.NewGuid().ToString("D"),
            Email = normalizedEmail,
            DisplayName = string.IsNullOrWhiteSpace(profile.DisplayName) ? "Facebook User" : profile.DisplayName,
            AvatarUrl = profile.AvatarUrl,
            PasswordHash = _passwordHasher.Hash(Guid.NewGuid().ToString("N")),
            Role = UserRoles.User,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _db.Users.AddAsync(user, cancellationToken);
        await _db.UserAuthIdentities.AddAsync(
            CreateIdentity(user.Id, AuthProviders.Facebook, providerUserId, profile.Email, now),
            cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
        return user;
    }

    private static UserAuthIdentity CreateIdentity(
        string userId,
        string provider,
        string providerUserId,
        string? providerEmail,
        DateTime? now = null)
    {
        var timestamp = now ?? DateTime.UtcNow;
        return new UserAuthIdentity
        {
            Id = Guid.NewGuid().ToString("D"),
            UserId = userId,
            Provider = provider,
            ProviderUserId = providerUserId,
            ProviderEmail = string.IsNullOrWhiteSpace(providerEmail) ? null : providerEmail.Trim().ToLowerInvariant(),
            LastSignInAt = timestamp,
            CreatedAt = timestamp,
            UpdatedAt = timestamp
        };
    }

    private static void ApplyUserProfile(User user, ExternalAuthUserInfo profile)
    {
        var changed = false;

        if (!string.IsNullOrWhiteSpace(profile.AvatarUrl) &&
            !string.Equals(user.AvatarUrl, profile.AvatarUrl, StringComparison.Ordinal))
        {
            user.AvatarUrl = profile.AvatarUrl;
            changed = true;
        }

        if (!string.IsNullOrWhiteSpace(profile.DisplayName) &&
            !string.Equals(user.DisplayName, profile.DisplayName, StringComparison.Ordinal))
        {
            user.DisplayName = profile.DisplayName;
            changed = true;
        }

        if (changed)
        {
            user.UpdatedAt = DateTime.UtcNow;
        }
    }

    private static string NormalizeProviderUserId(string providerUserId, string provider)
    {
        if (string.IsNullOrWhiteSpace(providerUserId))
        {
            throw new UnauthorizedAppException($"{provider} account id is unavailable.");
        }

        return providerUserId.Trim();
    }

    private static string NormalizeEmail(ExternalAuthUserInfo profile, string providerUserId)
    {
        if (!string.IsNullOrWhiteSpace(profile.Email))
        {
            return profile.Email.Trim().ToLowerInvariant();
        }

        return $"{AuthProviders.Facebook}.{providerUserId}@memopal.local".ToLowerInvariant();
    }
}
