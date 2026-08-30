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
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            throw new UnauthorizedAppException("Invalid Facebook access token.");
        }

        if (!string.IsNullOrWhiteSpace(_options.FacebookAppId))
        {
            await ValidateTokenAgainstAppAsync(accessToken, cancellationToken);
        }

        return await FetchProfileAsync(accessToken, cancellationToken);
    }

    private async Task ValidateTokenAgainstAppAsync(string accessToken, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_options.FacebookAppSecret))
        {
            throw new UnauthorizedAppException("Facebook app verification is not fully configured.");
        }

        var appToken = $"{_options.FacebookAppId}|{_options.FacebookAppSecret}";
        var url = $"https://graph.facebook.com/debug_token?input_token={Uri.EscapeDataString(accessToken)}&access_token={Uri.EscapeDataString(appToken)}";
        var response = await _httpClient.GetAsync(url, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new UnauthorizedAppException("Invalid Facebook access token.");
        }

        using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var json = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

        var data = TryGetObject(json.RootElement, "data");
        if (data is null)
        {
            throw new UnauthorizedAppException("Facebook token payload is invalid.");
        }

        var isValid = TryGetBoolean(data.Value, "is_valid");
        if (!isValid)
        {
            throw new UnauthorizedAppException("Invalid Facebook access token.");
        }

        var appId = TryGetString(data.Value, "app_id");
        if (!string.Equals(appId, _options.FacebookAppId, StringComparison.Ordinal))
        {
            throw new UnauthorizedAppException("Facebook token audience is invalid.");
        }
    }

    private async Task<ExternalAuthUserInfo> FetchProfileAsync(string accessToken, CancellationToken cancellationToken)
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

    private static JsonElement? TryGetObject(JsonElement root, string propertyName)
    {
        if (root.TryGetProperty(propertyName, out var value) && value.ValueKind == JsonValueKind.Object)
        {
            return value;
        }

        return null;
    }

    private static string? TryGetString(JsonElement root, string propertyName)
    {
        if (root.TryGetProperty(propertyName, out var value) && value.ValueKind == JsonValueKind.String)
        {
            return value.GetString();
        }

        return null;
    }

    private static bool TryGetBoolean(JsonElement root, string propertyName)
    {
        if (!root.TryGetProperty(propertyName, out var value))
        {
            return false;
        }

        return value.ValueKind switch
        {
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.String when bool.TryParse(value.GetString(), out var parsed) => parsed,
            _ => false
        };
    }
}
