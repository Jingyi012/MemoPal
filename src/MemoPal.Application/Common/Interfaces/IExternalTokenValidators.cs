namespace MemoPal.Application.Common.Interfaces;

public sealed record ExternalAuthUserInfo(
    string ProviderUserId,
    string? Email,
    string? DisplayName,
    string? AvatarUrl
);

public interface IGoogleTokenValidator
{
    Task<ExternalAuthUserInfo> ValidateAccessTokenAsync(string accessToken, CancellationToken cancellationToken = default);
}

public interface IFacebookTokenValidator
{
    Task<ExternalAuthUserInfo> ValidateAccessTokenAsync(string accessToken, CancellationToken cancellationToken = default);
}
