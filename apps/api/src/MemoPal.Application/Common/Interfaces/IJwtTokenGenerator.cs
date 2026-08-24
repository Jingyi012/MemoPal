namespace MemoPal.Application.Common.Interfaces;

public sealed record GeneratedAccessToken(string Token, DateTime ExpiresAtUtc);
public sealed record GeneratedRefreshToken(string Token, string TokenHash, DateTime ExpiresAtUtc);

public interface IJwtTokenGenerator
{
    GeneratedAccessToken GenerateAccessToken(string userId, string email, string role);
    GeneratedRefreshToken GenerateRefreshToken();
    string HashRefreshToken(string refreshToken);
    int GetMaxActiveRefreshTokensPerUser();
}
