using Google.Apis.Auth;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using Microsoft.Extensions.Options;

namespace MemoPal.Infrastructure.Auth;

public sealed class GoogleTokenValidator : IGoogleTokenValidator
{
    private readonly SocialAuthOptions _options;

    public GoogleTokenValidator(IOptions<SocialAuthOptions> options)
    {
        _options = options.Value;
    }

    public async Task<ExternalAuthUserInfo> ValidateIdTokenAsync(string idToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(idToken))
        {
            throw new UnauthorizedAppException("Invalid Google ID token.");
        }

        var audiences = _options.GoogleClientIds
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        if (audiences.Length == 0)
        {
            throw new UnauthorizedAppException("Google sign-in is not configured.");
        }

        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(
                idToken,
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = audiences,
                    HostedDomain = string.IsNullOrWhiteSpace(_options.GoogleHostedDomain)
                        ? null
                        : _options.GoogleHostedDomain.Trim()
                });
        }
        catch (InvalidJwtException)
        {
            throw new UnauthorizedAppException("Invalid Google ID token.");
        }

        if (string.IsNullOrWhiteSpace(payload.Subject))
        {
            throw new UnauthorizedAppException("Google token payload is missing subject.");
        }

        if (string.IsNullOrWhiteSpace(payload.Email))
        {
            throw new UnauthorizedAppException("Google token payload is missing email.");
        }

        if (!payload.EmailVerified)
        {
            throw new UnauthorizedAppException("Google email is not verified.");
        }

        return new ExternalAuthUserInfo(
            ProviderUserId: payload.Subject,
            Email: payload.Email,
            DisplayName: payload.Name,
            AvatarUrl: payload.Picture);
    }
}
