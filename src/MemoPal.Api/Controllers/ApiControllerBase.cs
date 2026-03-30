using Mapster;
using MemoPal.Api.Mapping;
using MediatR;
using MemoPal.Api.Options;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Domain.Common;
using MemoPal.Infrastructure.Storage;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace MemoPal.Api.Controllers;

[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    protected readonly ISender Sender;

    protected ApiControllerBase(ISender sender)
    {
        Sender = sender;
    }

    protected string GetUserIdOrThrow()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue("sub");

        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new UnauthorizedAppException("Missing or invalid user token.");
        }

        return userId;
    }

    protected bool IsAdmin()
    {
        return User.IsInRole(UserRoles.Admin);
    }

    protected T MapMediaUrls<T>(T value)
    {
        var config = MediaUrlMapsterConfigFactory.Get(GetMediaBaseUrl(), GetMediaPublicBasePath());
        return value.Adapt<T>(config);
    }

    protected IReadOnlyList<T> MapMediaUrls<T>(IReadOnlyList<T> value)
    {
        var config = MediaUrlMapsterConfigFactory.Get(GetMediaBaseUrl(), GetMediaPublicBasePath());
        return value.Adapt<List<T>>(config);
    }

    protected string ToAbsoluteMediaUrl(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        if (Uri.TryCreate(value, UriKind.Absolute, out _))
        {
            return value;
        }

        var normalized = value.Trim().Replace('\\', '/');
        if (normalized.StartsWith("~/", StringComparison.Ordinal))
        {
            normalized = normalized[1..];
        }

        if (!normalized.StartsWith("/", StringComparison.Ordinal))
        {
            normalized = "/" + normalized.TrimStart('/');
        }

        var normalizedPublicBasePath = NormalizePublicBasePath(GetMediaPublicBasePath());
        if (!string.IsNullOrWhiteSpace(normalizedPublicBasePath) &&
            !normalized.Equals(normalizedPublicBasePath, StringComparison.OrdinalIgnoreCase) &&
            !normalized.StartsWith($"{normalizedPublicBasePath}/", StringComparison.OrdinalIgnoreCase))
        {
            normalized = $"{normalizedPublicBasePath}{normalized}";
        }

        return $"{GetMediaBaseUrl()}{normalized}";
    }

    protected string? ToAbsoluteMediaUrlOrNull(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : ToAbsoluteMediaUrl(value);
    }

    private string GetMediaBaseUrl()
    {
        var configuredMediaBaseUrl = HttpContext?.RequestServices
            .GetService<IOptions<MediaUrlOptions>>()?
            .Value
            .BaseUrl?
            .Trim();

        if (!string.IsNullOrWhiteSpace(configuredMediaBaseUrl) &&
            Uri.TryCreate(configuredMediaBaseUrl, UriKind.Absolute, out var configuredUri))
        {
            return $"{configuredUri.Scheme}://{configuredUri.Authority}{configuredUri.AbsolutePath.TrimEnd('/')}";
        }

        return $"{Request.Scheme}://{Request.Host}{Request.PathBase}".TrimEnd('/');
    }

    private string GetMediaPublicBasePath()
    {
        var configuredPublicBasePath = HttpContext?.RequestServices
            .GetService<IOptions<FileStorageOptions>>()?
            .Value
            .PublicBasePath;

        return NormalizePublicBasePath(configuredPublicBasePath);
    }

    private static string NormalizePublicBasePath(string? publicBasePath)
    {
        if (string.IsNullOrWhiteSpace(publicBasePath))
        {
            return string.Empty;
        }

        var normalized = publicBasePath.Trim().Replace('\\', '/');
        if (!normalized.StartsWith("/", StringComparison.Ordinal))
        {
            normalized = "/" + normalized;
        }

        normalized = normalized.TrimEnd('/');
        return normalized == "/" ? string.Empty : normalized;
    }
}
