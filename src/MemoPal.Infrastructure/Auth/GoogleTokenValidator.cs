using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace MemoPal.Infrastructure.Auth;

public sealed class GoogleTokenValidator : IGoogleTokenValidator
{
    private readonly HttpClient _httpClient;
    private readonly SocialAuthOptions _options;

    public GoogleTokenValidator(HttpClient httpClient, IOptions<SocialAuthOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;
    }

    public async Task<ExternalAuthUserInfo> ValidateAccessTokenAsync(string accessToken, CancellationToken cancellationToken = default)
    {
        var url = $"https://www.googleapis.com/oauth2/v3/tokeninfo?access_token={Uri.EscapeDataString(accessToken)}";
        var response = await _httpClient.GetAsync(url, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new UnauthorizedAppException("Invalid Google access token.");
        }

        using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var json = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

        var root = json.RootElement;
        var sub = TryGetString(root, "sub");
        if (string.IsNullOrWhiteSpace(sub))
        {
            throw new UnauthorizedAppException("Google token payload is missing subject.");
        }

        var aud = TryGetString(root, "aud");
        if (!string.IsNullOrWhiteSpace(_options.GoogleAudience) && !string.Equals(aud, _options.GoogleAudience, StringComparison.Ordinal))
        {
            throw new UnauthorizedAppException("Google token audience is invalid.");
        }

        return new ExternalAuthUserInfo(
            ProviderUserId: sub,
            Email: TryGetString(root, "email"),
            DisplayName: TryGetString(root, "name"),
            AvatarUrl: TryGetString(root, "picture"));
    }

    private static string? TryGetString(JsonElement root, string propertyName)
    {
        if (root.TryGetProperty(propertyName, out var value) && value.ValueKind == JsonValueKind.String)
        {
            return value.GetString();
        }

        return null;
    }
}
