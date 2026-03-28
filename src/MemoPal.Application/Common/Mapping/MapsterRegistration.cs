using Mapster;
using MemoPal.Application.Features.Auth.DTOs;
using MemoPal.Application.Features.Badges.DTOs;
using MemoPal.Application.Features.LessonProgress.DTOs;
using MemoPal.Application.Features.Lessons.DTOs;
using MemoPal.Application.Features.Locations.DTOs;
using MemoPal.Application.Features.Milestones.DTOs;
using MemoPal.Application.Features.Notifications.DTOs;
using MemoPal.Application.Features.Palaces.DTOs;
using MemoPal.Application.Features.Reviews.DTOs;
using MemoPal.Application.Features.Users.DTOs;
using MemoPal.Application.Features.Words.DTOs;
using MemoPal.Domain.Entities;
using System.Text.Json;
using ManagedUserApiDto = MemoPal.Application.Features.Users.DTOs.ManagedUserDto;

namespace MemoPal.Application.Common.Mapping;

public static class MapsterRegistration
{
    public static void Register(TypeAdapterConfig config)
    {
        config.NewConfig<UserStats, UserStatsDto>();
        config.NewConfig<Palace, PalaceDto>();
        config.NewConfig<Location, LocationDto>();
        config.NewConfig<Word, WordDto>();
        config.NewConfig<ReviewSchedule, ReviewScheduleDto>();
        config.NewConfig<Notification, NotificationDto>();
        config.NewConfig<BadgeDefinition, BadgeDefinitionDto>();
        config.NewConfig<MilestoneDefinition, MilestoneDefinitionDto>();
        config.NewConfig<User, ManagedUserApiDto>();
        config.NewConfig<LessonProgress, LessonProgressDto>()
            .Map(dest => dest.ReviewSchedules, _ => new List<ReviewScheduleDto>());

        config.NewConfig<Lesson, LessonDto>()
            .MapWith(src => new LessonDto(
                src.Id,
                src.PalaceId,
                src.Title,
                src.Description,
                src.WordCount,
                src.Category,
                string.IsNullOrWhiteSpace(src.TagJson) ? null : JsonSerializer.Deserialize<string[]>(src.TagJson),
                src.IsCustom,
                src.IsLocked,
                src.Completed,
                src.IsPremium,
                src.Privacy,
                src.CreatedBy,
                null,
                null,
                src.CreatedAt,
                src.UpdatedAt,
                src.IsDeleted,
                src.DeletedAt));

        config.NewConfig<(User User, UserStats? Stats), UserWithStatDto>()
            .Map(dest => dest.Id, src => src.User.Id)
            .Map(dest => dest.DisplayName, src => src.User.DisplayName)
            .Map(dest => dest.AvatarUrl, src => src.User.AvatarUrl)
            .Map(dest => dest.Email, src => src.User.Email)
            .Map(dest => dest.TotalXp, src => src.User.TotalXp)
            .Map(dest => dest.Level, src => src.User.Level)
            .Map(dest => dest.IsPremium, src => src.User.IsPremium)
            .Map(dest => dest.Stats, src => src.Stats == null ? null : src.Stats.Adapt<UserStatsDto>())
            .Map(dest => dest.CreatedAt, src => src.User.CreatedAt)
            .Map(dest => dest.UpdatedAt, src => src.User.UpdatedAt)
            .Map(dest => dest.IsDeleted, src => src.User.IsDeleted)
            .Map(dest => dest.DeletedAt, src => src.User.DeletedAt);

        config.NewConfig<(BadgeDefinition Badge, UserBadge? UserBadge), BadgeDto>()
            .Map(dest => dest.Id, src => src.Badge.Id)
            .Map(dest => dest.Key, src => src.Badge.Key)
            .Map(dest => dest.Name, src => src.Badge.Name)
            .Map(dest => dest.Description, src => src.Badge.Description)
            .Map(dest => dest.Icon, src => src.Badge.Icon)
            .Map(dest => dest.IconUrl, src => src.Badge.IconUrl)
            .Map(dest => dest.Rarity, src => src.Badge.Rarity)
            .Map(dest => dest.ConditionType, src => src.Badge.ConditionType)
            .Map(dest => dest.ConditionValue, src => src.Badge.ConditionValue)
            .Map(dest => dest.EarnedAt, src => src.UserBadge == null ? null : src.UserBadge.EarnedAt)
            .Map(dest => dest.CreatedAt, src => src.Badge.CreatedAt)
            .Map(dest => dest.UpdatedAt, src => src.Badge.UpdatedAt)
            .Map(dest => dest.IsDeleted, src => src.Badge.IsDeleted)
            .Map(dest => dest.DeletedAt, src => src.Badge.DeletedAt);

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

        config.NewConfig<(LessonProgress Progress, IReadOnlyList<ReviewScheduleDto> Schedules), LessonProgressDto>()
            .Map(dest => dest.Id, src => src.Progress.Id)
            .Map(dest => dest.LessonId, src => src.Progress.LessonId)
            .Map(dest => dest.FirstCompletedDate, src => src.Progress.FirstCompletedDate)
            .Map(dest => dest.ReviewSchedules, src => src.Schedules)
            .Map(dest => dest.TotalReviews, src => src.Progress.TotalReviews)
            .Map(dest => dest.MasteryLevel, src => src.Progress.MasteryLevel)
            .Map(dest => dest.LastReviewDate, src => src.Progress.LastReviewDate)
            .Map(dest => dest.XpEarned, src => src.Progress.XpEarned)
            .Map(dest => dest.CreatedAt, src => src.Progress.CreatedAt)
            .Map(dest => dest.UpdatedAt, src => src.Progress.UpdatedAt)
            .Map(dest => dest.IsDeleted, src => src.Progress.IsDeleted)
            .Map(dest => dest.DeletedAt, src => src.Progress.DeletedAt);

        config.NewConfig<(Lesson Lesson, LessonProgressDto? Progress, IReadOnlyList<WordDto>? Words), LessonDto>()
            .Map(dest => dest.Id, src => src.Lesson.Id)
            .Map(dest => dest.PalaceId, src => src.Lesson.PalaceId)
            .Map(dest => dest.Title, src => src.Lesson.Title)
            .Map(dest => dest.Description, src => src.Lesson.Description)
            .Map(dest => dest.WordCount, src => src.Lesson.WordCount)
            .Map(dest => dest.Category, src => src.Lesson.Category)
            .Map(dest => dest.Tag, src => string.IsNullOrWhiteSpace(src.Lesson.TagJson)
                ? null
                : JsonSerializer.Deserialize<string[]>(src.Lesson.TagJson))
            .Map(dest => dest.IsCustom, src => src.Lesson.IsCustom)
            .Map(dest => dest.IsLocked, src => src.Lesson.IsLocked)
            .Map(dest => dest.Completed, src => src.Lesson.Completed)
            .Map(dest => dest.IsPremium, src => src.Lesson.IsPremium)
            .Map(dest => dest.Privacy, src => src.Lesson.Privacy)
            .Map(dest => dest.CreatedBy, src => src.Lesson.CreatedBy)
            .Map(dest => dest.Progress, src => src.Progress)
            .Map(dest => dest.Words, src => src.Words)
            .Map(dest => dest.CreatedAt, src => src.Lesson.CreatedAt)
            .Map(dest => dest.UpdatedAt, src => src.Lesson.UpdatedAt)
            .Map(dest => dest.IsDeleted, src => src.Lesson.IsDeleted)
            .Map(dest => dest.DeletedAt, src => src.Lesson.DeletedAt);
    }
}

