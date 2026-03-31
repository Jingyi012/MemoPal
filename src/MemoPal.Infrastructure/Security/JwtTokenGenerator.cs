using MemoPal.Application.Common.Interfaces;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace MemoPal.Infrastructure.Security;

public sealed class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly JwtOptions _options;

    public JwtTokenGenerator(IOptions<JwtOptions> options)
    {
        _options = options.Value;
    }

    public GeneratedAccessToken GenerateAccessToken(string userId, string email, string role)
    {
        var now = DateTime.UtcNow;
        var secret = string.IsNullOrWhiteSpace(_options.Secret)
            ? "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_KEY_AT_LEAST_32_CHARS"
            : _options.Secret;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId),
            new(ClaimTypes.NameIdentifier, userId),
            new(JwtRegisteredClaimNames.Email, email),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Role, role),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
            new(JwtRegisteredClaimNames.Iat, new DateTimeOffset(now).ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
        };

        var accessTokenLifetimeMinutes = ResolveAccessTokenExpiryMinutes();
        var expiresAt = now.AddMinutes(accessTokenLifetimeMinutes);
        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: now,
            expires: expiresAt,
            signingCredentials: credentials);

        return new GeneratedAccessToken(new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }

    public GeneratedRefreshToken GenerateRefreshToken()
    {
        var now = DateTime.UtcNow;
        var refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        var refreshTokenHash = HashRefreshToken(refreshToken);
        var expiresAt = now.AddDays(Math.Max(1, _options.RefreshTokenExpiryDays));
        return new GeneratedRefreshToken(refreshToken, refreshTokenHash, expiresAt);
    }

    public string HashRefreshToken(string refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return string.Empty;
        }

        var bytes = Encoding.UTF8.GetBytes(refreshToken.Trim());
        var hashBytes = SHA256.HashData(bytes);
        return Convert.ToHexString(hashBytes);
    }

    public int GetMaxActiveRefreshTokensPerUser()
    {
        return Math.Max(1, _options.MaxActiveRefreshTokensPerUser);
    }

    private int ResolveAccessTokenExpiryMinutes()
    {
        if (_options.AccessTokenExpiryMinutes > 0)
        {
            return _options.AccessTokenExpiryMinutes;
        }

#pragma warning disable CS0618 // Backward compatibility fallback for legacy config.
        if (_options.ExpiryMinutes > 0)
        {
            return _options.ExpiryMinutes;
        }
#pragma warning restore CS0618

        return 15;
    }
}
