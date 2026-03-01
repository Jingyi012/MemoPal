using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace MemoPal.Infrastructure.Auth;

public sealed class FacebookTokenValidator : IFacebookTokenValidator
{
    private readonly HttpClient _httpClient;
    private readonly SocialAuthOptions _options;

    public FacebookTokenValidator(HttpClient httpClient, IOptions<SocialAuthOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;
    }

    public async Task<ExternalAuthUserInfo> ValidateAccessTokenAsync(string accessToken, CancellationToken cancellationToken = default)
    {
        var url = $"https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token={Uri.EscapeDataString(accessToken)}";
        var response = await _httpClient.GetAsync(url, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new UnauthorizedAppException("Invalid Facebook access token.");
        }

        using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var json = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

        var root = json.RootElement;
        var id = TryGetString(root, "id");
        if (string.IsNullOrWhiteSpace(id))
        {
            throw new UnauthorizedAppException("Facebook token payload is missing user id.");
        }

        if (!string.IsNullOrWhiteSpace(_options.FacebookAppId))
        {
            // Optional app ID setting retained for future stricter token introspection.
        }

        string? avatarUrl = null;
        if (root.TryGetProperty("picture", out var picture)
            && picture.TryGetProperty("data", out var data)
            && data.TryGetProperty("url", out var urlNode)
            && urlNode.ValueKind == JsonValueKind.String)
        {
            avatarUrl = urlNode.GetString();
        }

        return new ExternalAuthUserInfo(
            ProviderUserId: id,
            Email: TryGetString(root, "email"),
            DisplayName: TryGetString(root, "name"),
            AvatarUrl: avatarUrl);
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
