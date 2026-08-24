using Mapster;
using MemoPal.Application.Features.Auth.DTOs;
using MemoPal.Application.Features.Badges.DTOs;
using MemoPal.Application.Features.Milestones.DTOs;
using MemoPal.Application.Features.Notifications.DTOs;
using MemoPal.Application.Features.Users.DTOs;
using MemoPal.Domain.Entities;
using ManagedUserApiDto = MemoPal.Application.Features.Users.DTOs.ManagedUserDto;

namespace MemoPal.Application.Common.Mapping;

public sealed class MapsterRegistration : IRegister
{
    public static string BaseUrl { get; set; } = string.Empty;
    public static string PublicBasePath { get; set; } = "/files";

    public void Register(TypeAdapterConfig config)
    {
        config.NewConfig<UserStats, UserStatsDto>();
        config.NewConfig<Notification, NotificationDto>();
        config.NewConfig<BadgeDefinition, BadgeDefinitionDto>()
            .Map(dest => dest.IconUrl, src => ToAbsoluteMediaUrlOrNull(src.IconUrl));
        config.NewConfig<BadgeDefinitionDto, BadgeDefinitionDto>()
            .Map(dest => dest.IconUrl, src => ToAbsoluteMediaUrlOrNull(src.IconUrl));
        config.NewConfig<MilestoneDefinition, MilestoneDefinitionDto>();
        config.NewConfig<User, ManagedUserApiDto>()
            .Map(dest => dest.AvatarUrl, src => ToAbsoluteMediaUrlOrNull(src.AvatarUrl));
        config.NewConfig<ManagedUserApiDto, ManagedUserApiDto>()
            .Map(dest => dest.AvatarUrl, src => ToAbsoluteMediaUrlOrNull(src.AvatarUrl));

        config.NewConfig<(User User, UserStats? Stats), UserWithStatDto>()
            .Map(dest => dest.Id, src => src.User.Id)
            .Map(dest => dest.DisplayName, src => src.User.DisplayName)
            .Map(dest => dest.AvatarUrl, src => ToAbsoluteMediaUrlOrNull(src.User.AvatarUrl))
            .Map(dest => dest.Email, src => src.User.Email)
            .Map(dest => dest.TotalXp, src => src.User.TotalXp)
            .Map(dest => dest.Level, src => src.User.Level)
            .Map(dest => dest.IsPremium, src => src.User.IsPremium)
            .Map(dest => dest.Stats, src => src.Stats == null ? null : src.Stats.Adapt<UserStatsDto>())
            .Map(dest => dest.CreatedAt, src => src.User.CreatedAt)
            .Map(dest => dest.UpdatedAt, src => src.User.UpdatedAt)
            .Map(dest => dest.IsDeleted, src => src.User.IsDeleted)
            .Map(dest => dest.DeletedAt, src => src.User.DeletedAt);

        config.NewConfig<UserWithStatDto, UserWithStatDto>()
            .Map(dest => dest.AvatarUrl, src => ToAbsoluteMediaUrlOrNull(src.AvatarUrl));
        config.NewConfig<AuthResponseDto, AuthResponseDto>();

        config.NewConfig<(BadgeDefinition Badge, UserBadge? UserBadge), BadgeDto>()
            .Map(dest => dest.Id, src => src.Badge.Id)
            .Map(dest => dest.Key, src => src.Badge.Key)
            .Map(dest => dest.Name, src => src.Badge.Name)
            .Map(dest => dest.Description, src => src.Badge.Description)
            .Map(dest => dest.Icon, src => src.Badge.Icon)
            .Map(dest => dest.IconUrl, src => ToAbsoluteMediaUrlOrNull(src.Badge.IconUrl))
            .Map(dest => dest.Rarity, src => src.Badge.Rarity)
            .Map(dest => dest.ConditionType, src => src.Badge.ConditionType)
            .Map(dest => dest.ConditionValue, src => src.Badge.ConditionValue)
            .Map(dest => dest.EarnedAt, src => src.UserBadge == null ? null : src.UserBadge.EarnedAt)
            .Map(dest => dest.CreatedAt, src => src.Badge.CreatedAt)
            .Map(dest => dest.UpdatedAt, src => src.Badge.UpdatedAt)
            .Map(dest => dest.IsDeleted, src => src.Badge.IsDeleted)
            .Map(dest => dest.DeletedAt, src => src.Badge.DeletedAt);

        config.NewConfig<BadgeDto, BadgeDto>()
            .Map(dest => dest.IconUrl, src => ToAbsoluteMediaUrlOrNull(src.IconUrl));

        config.NewConfig<(MilestoneDefinition Milestone, UserMilestone? UserMilestone), MilestoneDto>()
            .Map(dest => dest.Id, src => src.Milestone.Id)
            .Map(dest => dest.Key, src => src.Milestone.Key)
            .Map(dest => dest.Title, src => src.Milestone.Title)
            .Map(dest => dest.Description, src => src.Milestone.Description)
            .Map(dest => dest.ConditionType, src => src.Milestone.ConditionType)
            .Map(dest => dest.ConditionValue, src => src.Milestone.ConditionValue)
            .Map(dest => dest.AchievedAt, src => src.UserMilestone == null ? null : src.UserMilestone.AchievedAt)
            .Map(dest => dest.CreatedAt, src => src.Milestone.CreatedAt)
            .Map(dest => dest.UpdatedAt, src => src.Milestone.UpdatedAt)
            .Map(dest => dest.IsDeleted, src => src.Milestone.IsDeleted)
            .Map(dest => dest.DeletedAt, src => src.Milestone.DeletedAt);

    }

    private static string ToAbsoluteMediaUrl(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var trimmed = value.Trim();
        if (Uri.TryCreate(trimmed, UriKind.Absolute, out _))
        {
            return trimmed;
        }

        var normalizedPath = trimmed.Replace('\\', '/');
        if (!normalizedPath.StartsWith("/", StringComparison.Ordinal))
        {
            normalizedPath = "/" + normalizedPath;
        }

        var mediaBaseUrl = NormalizeBaseUrl(BaseUrl);
        var publicBasePath = NormalizePublicBasePath(PublicBasePath);
        var publicPath = normalizedPath;
        if (!string.IsNullOrWhiteSpace(publicBasePath) &&
            !normalizedPath.Equals(publicBasePath, StringComparison.OrdinalIgnoreCase) &&
            !normalizedPath.StartsWith(publicBasePath + "/", StringComparison.OrdinalIgnoreCase))
        {
            publicPath = publicBasePath + normalizedPath;
        }

        if (string.IsNullOrWhiteSpace(mediaBaseUrl))
        {
            return publicPath;
        }

        return mediaBaseUrl.TrimEnd('/') + publicPath;
    }

    private static string? ToAbsoluteMediaUrlOrNull(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : ToAbsoluteMediaUrl(value);
    }

    private static string NormalizeBaseUrl(string? value)
    {
        return (value ?? string.Empty).Trim().TrimEnd('/');
    }

    private static string NormalizePublicBasePath(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            value = "/files";
        }

        value = value.Trim().Replace('\\', '/');
        if (!value.StartsWith("/", StringComparison.Ordinal))
        {
            value = "/" + value;
        }

        value = value.TrimEnd('/');
        return value == "/" ? string.Empty : value;
    }
}

