using MediatR;
using MemoPal.Api.Options;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Features.Auth.DTOs;
using MemoPal.Application.Features.Badges.DTOs;
using MemoPal.Application.Features.Community.DTOs;
using MemoPal.Application.Features.Locations.DTOs;
using MemoPal.Application.Features.Palaces.DTOs;
using MemoPal.Application.Features.Users.DTOs;
using MemoPal.Domain.Common;
using MemoPal.Infrastructure.Storage;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Collections;
using System.Reflection;
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
        var sampleBefore = ExtractMediaPathSample(value);
        var mediaBaseUrl = GetMediaBaseUrl();
        var mediaPublicBasePath = GetMediaPublicBasePath();
        var mapped = ApplyManualMediaMapping(value);
        var sampleAfter = ExtractMediaPathSample(mapped);

        LogMediaMappingDiagnostics(
            phase: "single",
            mediaBaseUrl: mediaBaseUrl,
            mediaPublicBasePath: mediaPublicBasePath,
            sampleBefore: sampleBefore,
            sampleAfter: sampleAfter,
            count: 1);

        return mapped;
    }

    protected IReadOnlyList<T> MapMediaUrls<T>(IReadOnlyList<T> value)
    {
        var sampleBefore = ExtractMediaPathSample(value);
        var mediaBaseUrl = GetMediaBaseUrl();
        var mediaPublicBasePath = GetMediaPublicBasePath();
        var mapped = value.Select(ApplyManualMediaMapping).ToList();
        var sampleAfter = ExtractMediaPathSample(mapped);

        LogMediaMappingDiagnostics(
            phase: "list",
            mediaBaseUrl: mediaBaseUrl,
            mediaPublicBasePath: mediaPublicBasePath,
            sampleBefore: sampleBefore,
            sampleAfter: sampleAfter,
            count: value.Count);

        return mapped;
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
        var mediaOptions = GetMediaOptions();
        var configuredMediaBaseUrl = mediaOptions.BaseUrl?.Trim();

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

    private MediaUrlOptions GetMediaOptions()
    {
        return HttpContext?.RequestServices
                   .GetService<IOptions<MediaUrlOptions>>()?
                   .Value
               ?? new MediaUrlOptions();
    }

    private bool IsMediaDiagnosticsEnabled()
    {
        return GetMediaOptions().DiagnosticsEnabled;
    }

    private ILogger? GetMediaDiagnosticsLogger()
    {
        return HttpContext?.RequestServices
            .GetService<ILoggerFactory>()?
            .CreateLogger("MemoPal.MediaUrlDiagnostics");
    }

    private void LogMediaMappingDiagnostics(
        string phase,
        string mediaBaseUrl,
        string mediaPublicBasePath,
        string? sampleBefore,
        string? sampleAfter,
        int count)
    {
        if (!IsMediaDiagnosticsEnabled())
        {
            return;
        }

        var logger = GetMediaDiagnosticsLogger();
        if (logger is null)
        {
            return;
        }

        logger.LogInformation(
            "Media mapping phase={Phase} path={RequestPath} baseUrl={BaseUrl} publicBasePath={PublicBasePath} count={Count} sampleBefore={SampleBefore} sampleAfter={SampleAfter}",
            phase,
            Request.Path.Value ?? string.Empty,
            mediaBaseUrl,
            mediaPublicBasePath,
            count,
            sampleBefore ?? string.Empty,
            sampleAfter ?? string.Empty);
    }

    private static string? ExtractMediaPathSample(object? value)
    {
        if (value is null)
        {
            return null;
        }

        if (value is string strValue)
        {
            return string.IsNullOrWhiteSpace(strValue) ? null : strValue.Trim();
        }

        if (value is IEnumerable enumerable && value is not string)
        {
            foreach (var item in enumerable)
            {
                var sampleFromItem = ExtractMediaPathSample(item);
                if (!string.IsNullOrWhiteSpace(sampleFromItem))
                {
                    return sampleFromItem;
                }
            }

            return null;
        }

        var properties = value.GetType().GetProperties(BindingFlags.Instance | BindingFlags.Public);
        var candidates = new[] { "Thumbnail", "ImageUrl", "IconUrl", "AvatarUrl" };

        foreach (var candidate in candidates)
        {
            var property = properties.FirstOrDefault(p => string.Equals(p.Name, candidate, StringComparison.Ordinal));
            if (property?.PropertyType != typeof(string))
            {
                continue;
            }

            if (property.GetValue(value) is string propValue && !string.IsNullOrWhiteSpace(propValue))
            {
                return propValue.Trim();
            }
        }

        return null;
    }

    private T ApplyManualMediaMapping<T>(T value)
    {
        object mapped = value! switch
        {
            PalaceDto dto => dto with { Thumbnail = ToAbsoluteMediaUrl(dto.Thumbnail) },
            LocationDto dto => dto with { ImageUrl = ToAbsoluteMediaUrl(dto.ImageUrl) },
            BadgeDto dto => dto with { IconUrl = ToAbsoluteMediaUrlOrNull(dto.IconUrl) },
            BadgeDefinitionDto dto => dto with { IconUrl = ToAbsoluteMediaUrlOrNull(dto.IconUrl) },
            UserWithStatDto dto => dto with { AvatarUrl = ToAbsoluteMediaUrlOrNull(dto.AvatarUrl) },
            AuthResponseDto dto => dto with { User = ApplyManualMediaMapping(dto.User) },
            ManagedUserDto dto => dto with { AvatarUrl = ToAbsoluteMediaUrlOrNull(dto.AvatarUrl) },
            ManagedUserPalaceDataDto dto => dto with
            {
                Locations = dto.Locations.Select(ApplyManualMediaMapping).ToList()
            },
            ManagedUserDataDto dto => dto with
            {
                User = ApplyManualMediaMapping(dto.User),
                Palaces = dto.Palaces.Select(ApplyManualMediaMapping).ToList()
            },
            ManagedUserDataOverviewDto dto => dto with
            {
                User = ApplyManualMediaMapping(dto.User)
            },
            ManagedUserLocationDataDto dto => dto with { ImageUrl = ToAbsoluteMediaUrl(dto.ImageUrl) },
            CommunityCreatorDto dto => dto with { AvatarUrl = ToAbsoluteMediaUrlOrNull(dto.AvatarUrl) },
            CommunityLessonDto dto => dto with
            {
                Creator = ApplyManualMediaMapping(dto.Creator)
            },
            _ => value!
        };

        return mapped is T typed ? typed : value;
    }
}
