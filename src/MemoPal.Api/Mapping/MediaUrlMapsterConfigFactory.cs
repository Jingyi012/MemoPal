using Mapster;
using MemoPal.Application.Features.Auth.DTOs;
using MemoPal.Application.Features.Badges.DTOs;
using MemoPal.Application.Features.Community.DTOs;
using MemoPal.Application.Features.Locations.DTOs;
using MemoPal.Application.Features.Palaces.DTOs;
using MemoPal.Application.Features.Users.DTOs;
using System.Collections.Concurrent;

namespace MemoPal.Api.Mapping;

public static class MediaUrlMapsterConfigFactory
{
    private static readonly ConcurrentDictionary<(string BaseUrl, string PublicBasePath), TypeAdapterConfig> Cache = new();

    public static TypeAdapterConfig Get(string mediaBaseUrl, string mediaPublicBasePath)
    {
        var normalizedBaseUrl = NormalizeBaseUrl(mediaBaseUrl);
        var normalizedPublicBasePath = NormalizePublicBasePath(mediaPublicBasePath);
        return Cache.GetOrAdd((normalizedBaseUrl, normalizedPublicBasePath), key => Build(key.BaseUrl, key.PublicBasePath));
    }

    private static TypeAdapterConfig Build(string mediaBaseUrl, string mediaPublicBasePath)
    {
        var config = new TypeAdapterConfig();
        config.Default.ShallowCopyForSameType(false);

        config.NewConfig<PalaceDto, PalaceDto>()
            .Map(dest => dest.Thumbnail, src => ToAbsoluteMediaUrl(src.Thumbnail, mediaBaseUrl, mediaPublicBasePath));

        config.NewConfig<LocationDto, LocationDto>()
            .Map(dest => dest.ImageUrl, src => ToAbsoluteMediaUrl(src.ImageUrl, mediaBaseUrl, mediaPublicBasePath));

        config.NewConfig<BadgeDto, BadgeDto>()
            .Map(dest => dest.IconUrl, src => ToAbsoluteMediaUrlOrNull(src.IconUrl, mediaBaseUrl, mediaPublicBasePath));

        config.NewConfig<BadgeDefinitionDto, BadgeDefinitionDto>()
            .Map(dest => dest.IconUrl, src => ToAbsoluteMediaUrlOrNull(src.IconUrl, mediaBaseUrl, mediaPublicBasePath));

        config.NewConfig<UserWithStatDto, UserWithStatDto>()
            .Map(dest => dest.AvatarUrl, src => ToAbsoluteMediaUrlOrNull(src.AvatarUrl, mediaBaseUrl, mediaPublicBasePath));

        config.NewConfig<ManagedUserDto, ManagedUserDto>()
            .Map(dest => dest.AvatarUrl, src => ToAbsoluteMediaUrlOrNull(src.AvatarUrl, mediaBaseUrl, mediaPublicBasePath));

        config.NewConfig<ManagedUserLocationDataDto, ManagedUserLocationDataDto>()
            .Map(dest => dest.ImageUrl, src => ToAbsoluteMediaUrl(src.ImageUrl, mediaBaseUrl, mediaPublicBasePath));

        config.NewConfig<CommunityCreatorDto, CommunityCreatorDto>()
            .Map(dest => dest.AvatarUrl, src => ToAbsoluteMediaUrlOrNull(src.AvatarUrl, mediaBaseUrl, mediaPublicBasePath));

        config.NewConfig<AuthResponseDto, AuthResponseDto>();
        config.NewConfig<ManagedUserPalaceDataDto, ManagedUserPalaceDataDto>();
        config.NewConfig<ManagedUserDataDto, ManagedUserDataDto>();
        config.NewConfig<CommunityLessonDto, CommunityLessonDto>();

        return config;
    }

    private static string ToAbsoluteMediaUrl(string? value, string mediaBaseUrl, string mediaPublicBasePath)
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

        if (!string.IsNullOrWhiteSpace(mediaPublicBasePath) &&
            !normalized.Equals(mediaPublicBasePath, StringComparison.OrdinalIgnoreCase) &&
            !normalized.StartsWith($"{mediaPublicBasePath}/", StringComparison.OrdinalIgnoreCase))
        {
            normalized = $"{mediaPublicBasePath}{normalized}";
        }

        return $"{mediaBaseUrl}{normalized}";
    }

    private static string? ToAbsoluteMediaUrlOrNull(string? value, string mediaBaseUrl, string mediaPublicBasePath)
    {
        return string.IsNullOrWhiteSpace(value) ? null : ToAbsoluteMediaUrl(value, mediaBaseUrl, mediaPublicBasePath);
    }

    private static string NormalizeBaseUrl(string? mediaBaseUrl)
    {
        if (string.IsNullOrWhiteSpace(mediaBaseUrl))
        {
            return string.Empty;
        }

        if (!Uri.TryCreate(mediaBaseUrl, UriKind.Absolute, out var uri))
        {
            return string.Empty;
        }

        return $"{uri.Scheme}://{uri.Authority}{uri.AbsolutePath.TrimEnd('/')}";
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
