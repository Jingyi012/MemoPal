using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Users.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace MemoPal.Application.Features.Users.Queries;

public sealed record GetManagedUserDataQuery(string UserId) : IRequest<ApiResponse<ManagedUserDataDto>>;

public sealed class GetManagedUserDataQueryHandler : IRequestHandler<GetManagedUserDataQuery, ApiResponse<ManagedUserDataDto>>
{
    private readonly IAppDbContext _db;

    public GetManagedUserDataQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<ManagedUserDataDto>> Handle(GetManagedUserDataQuery request, CancellationToken cancellationToken)
    {
        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.UserId, cancellationToken)
            ?? throw new NotFoundAppException("User not found.");

        var stats = await _db.UserStats
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == request.UserId, cancellationToken);

        var userPalaceRelations = await _db.UserPalaces
            .AsNoTracking()
            .Where(x => x.UserId == request.UserId && !x.IsDeleted)
            .OrderByDescending(x => x.UpdatedAt)
            .ToListAsync(cancellationToken);

        var palaceIds = userPalaceRelations
            .Select(x => x.PalaceId)
            .Distinct()
            .ToList();

        var palaces = palaceIds.Count == 0
            ? []
            : await _db.Palaces
                .AsNoTracking()
                .Where(x => palaceIds.Contains(x.Id) && !x.IsDeleted)
                .OrderByDescending(x => x.UpdatedAt)
                .ToListAsync(cancellationToken);

        var userPalaceByPalaceId = userPalaceRelations
            .GroupBy(x => x.PalaceId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(x => x.UpdatedAt).First(),
                StringComparer.Ordinal);

        var palaceIdList = palaces.Select(x => x.Id).ToList();
        var locations = palaceIdList.Count == 0
            ? []
            : await _db.Locations
                .AsNoTracking()
                .Where(x => palaceIdList.Contains(x.PalaceId))
                .OrderBy(x => x.Position)
                .ThenByDescending(x => x.UpdatedAt)
                .ToListAsync(cancellationToken);

        var lessons = await _db.Lessons
            .AsNoTracking()
            .Where(x => x.CreatedBy == request.UserId)
            .OrderByDescending(x => x.UpdatedAt)
            .ToListAsync(cancellationToken);

        var lessonIds = lessons.Select(x => x.Id).ToList();
        var words = lessonIds.Count == 0
            ? []
            : await _db.Words
                .AsNoTracking()
                .Where(x => lessonIds.Contains(x.LessonId))
                .OrderByDescending(x => x.UpdatedAt)
                .ToListAsync(cancellationToken);

        var progresses = await _db.LessonProgresses
            .AsNoTracking()
            .Where(x => x.UserId == request.UserId)
            .OrderByDescending(x => x.UpdatedAt)
            .ToListAsync(cancellationToken);

        var progressIds = progresses.Select(x => x.Id).ToList();
        var schedules = progressIds.Count == 0
            ? []
            : await _db.ReviewSchedules
                .AsNoTracking()
                .Where(x => x.UserId == request.UserId && progressIds.Contains(x.LessonProgressId))
                .OrderByDescending(x => x.UpdatedAt)
                .ToListAsync(cancellationToken);

        var progressLessonIds = progresses.Select(x => x.LessonId).Distinct().ToList();
        var progressLessonRows = progressLessonIds.Count == 0
            ? []
            : await _db.Lessons
                .AsNoTracking()
                .Where(x => progressLessonIds.Contains(x.Id))
                .Select(x => new { x.Id, x.Title, x.PalaceId, x.IsCustom })
                .ToListAsync(cancellationToken);
        var progressPalaceIds = progressLessonRows.Select(x => x.PalaceId).Distinct().ToList();
        var progressPalaceRows = progressPalaceIds.Count == 0
            ? []
            : await _db.Palaces
                .AsNoTracking()
                .Where(x => progressPalaceIds.Contains(x.Id))
                .Select(x => new { x.Id, x.Name, x.IsCustom })
                .ToListAsync(cancellationToken);

        var progressPalaceById = progressPalaceRows.ToDictionary(x => x.Id, x => x, StringComparer.Ordinal);
        var progressLessonMetaById = progressLessonRows.ToDictionary(
            x => x.Id,
            x =>
            {
                var palace = progressPalaceById.GetValueOrDefault(x.PalaceId);
                return new
                {
                    x.Title,
                    x.PalaceId,
                    PalaceName = palace?.Name ?? x.PalaceId,
                    PalaceIsCustom = palace?.IsCustom ?? false,
                    LessonIsCustom = x.IsCustom ?? false,
                };
            },
            StringComparer.Ordinal);

        var badgeRows = await (
            from userBadge in _db.UserBadges.AsNoTracking()
            join definition in _db.BadgeDefinitions.AsNoTracking()
                on userBadge.BadgeId equals definition.Id
            where userBadge.UserId == request.UserId
            orderby userBadge.UpdatedAt descending
            select new { UserBadge = userBadge, Definition = definition }
        ).ToListAsync(cancellationToken);

        var milestoneRows = await (
            from userMilestone in _db.UserMilestones.AsNoTracking()
            join definition in _db.MilestoneDefinitions.AsNoTracking()
                on userMilestone.MilestoneId equals definition.Id
            where userMilestone.UserId == request.UserId
            orderby userMilestone.UpdatedAt descending
            select new { UserMilestone = userMilestone, Definition = definition }
        ).ToListAsync(cancellationToken);

        var xpEvents = await _db.XpEvents
            .AsNoTracking()
            .Where(x => x.UserId == request.UserId)
            .OrderByDescending(x => x.CreatedAt)
            .Take(500)
            .ToListAsync(cancellationToken);

        var notifications = await _db.Notifications
            .AsNoTracking()
            .Where(x => x.UserId == request.UserId)
            .OrderByDescending(x => x.CreatedAt)
            .Take(200)
            .ToListAsync(cancellationToken);

        var subscriptions = await _db.UserSubscriptions
            .AsNoTracking()
            .Where(x => x.UserId == request.UserId)
            .OrderByDescending(x => x.StartedAt)
            .ToListAsync(cancellationToken);

        var locationsByPalaceId = locations
            .GroupBy(x => x.PalaceId)
            .ToDictionary(
                g => g.Key,
                g => (IReadOnlyList<ManagedUserLocationDataDto>)g
                    .Select(x => new ManagedUserLocationDataDto(
                        x.Id,
                        x.PalaceId,
                        x.Position,
                        x.Name,
                        x.Description,
                        x.ImageUrl,
                        x.IsDeleted,
                        x.CreatedAt,
                        x.UpdatedAt))
                    .ToList(),
                StringComparer.Ordinal);

        var wordsByLessonId = words
            .GroupBy(x => x.LessonId)
            .ToDictionary(
                g => g.Key,
                g => (IReadOnlyList<ManagedUserWordDataDto>)g
                    .Select(x => new ManagedUserWordDataDto(
                        x.Id,
                        x.LessonId,
                        x.LocationId,
                        x.Text,
                        x.Meaning,
                        x.IsDeleted,
                        x.CreatedAt,
                        x.UpdatedAt))
                    .ToList(),
                StringComparer.Ordinal);

        var schedulesByProgressId = schedules
            .GroupBy(x => x.LessonProgressId)
            .ToDictionary(
                g => g.Key,
                g => (IReadOnlyList<ManagedUserReviewScheduleDataDto>)g
                    .OrderBy(x => x.ReviewRound)
                    .Select(x => new ManagedUserReviewScheduleDataDto(
                        x.Id,
                        x.LessonProgressId,
                        x.ReviewRound,
                        x.DueDate,
                        x.Completed,
                        x.CompletedDate,
                        x.IsDeleted,
                        x.CreatedAt,
                        x.UpdatedAt))
                    .ToList(),
                StringComparer.Ordinal);

        var palaceDtos = palaces
            .Select(x =>
            {
                userPalaceByPalaceId.TryGetValue(x.Id, out var relation);
                return new ManagedUserPalaceDataDto(
                    x.Id,
                    x.Name,
                    x.Description,
                    x.Level,
                    x.IsPremium,
                    x.IsCustom,
                    relation?.IsOwner ?? false,
                    relation?.IsUnlocked ?? false,
                    relation?.UnlockedAt,
                    x.IsDeleted,
                    x.CreatedAt,
                    x.UpdatedAt,
                    locationsByPalaceId.GetValueOrDefault(x.Id) ?? []);
            })
            .ToList();

        var lessonDtos = lessons
            .Select(x => new ManagedUserLessonDataDto(
                x.Id,
                x.PalaceId,
                x.Title,
                x.Description,
                x.WordCount,
                x.Category,
                string.IsNullOrWhiteSpace(x.TagJson) ? null : JsonSerializer.Deserialize<string[]>(x.TagJson),
                x.IsCustom,
                x.IsLocked,
                x.Completed,
                x.IsPremium,
                x.Privacy,
                x.CreatedBy,
                x.IsDeleted,
                x.DeletedAt,
                x.CreatedAt,
                x.UpdatedAt,
                wordsByLessonId.GetValueOrDefault(x.Id) ?? []))
            .ToList();

        var progressDtos = progresses
            .Select(x => new ManagedUserLessonProgressDataDto(
                x.Id,
                x.LessonId,
                progressLessonMetaById.GetValueOrDefault(x.LessonId)?.Title ?? x.LessonId,
                progressLessonMetaById.GetValueOrDefault(x.LessonId)?.PalaceId ?? string.Empty,
                progressLessonMetaById.GetValueOrDefault(x.LessonId)?.PalaceName ?? string.Empty,
                progressLessonMetaById.GetValueOrDefault(x.LessonId)?.PalaceIsCustom ?? false,
                progressLessonMetaById.GetValueOrDefault(x.LessonId)?.LessonIsCustom ?? false,
                x.FirstCompletedDate,
                x.TotalReviews,
                x.MasteryLevel,
                x.LastReviewDate,
                x.XpEarned,
                x.IsDeleted,
                x.CreatedAt,
                x.UpdatedAt,
                schedulesByProgressId.GetValueOrDefault(x.Id) ?? []))
            .ToList();

        var badgeDtos = badgeRows
            .Select(x => new ManagedUserBadgeDataDto(
                x.UserBadge.Id,
                x.UserBadge.BadgeId,
                x.Definition.Key,
                x.Definition.Name,
                x.Definition.Description,
                x.Definition.Rarity,
                x.UserBadge.EarnedAt,
                x.UserBadge.IsDeleted,
                x.UserBadge.CreatedAt,
                x.UserBadge.UpdatedAt))
            .ToList();

        var milestoneDtos = milestoneRows
            .Select(x => new ManagedUserMilestoneDataDto(
                x.UserMilestone.Id,
                x.UserMilestone.MilestoneId,
                x.Definition.Key,
                x.Definition.Title,
                x.Definition.Description,
                x.Definition.ConditionType,
                x.Definition.ConditionValue,
                x.UserMilestone.AchievedAt,
                x.UserMilestone.IsDeleted,
                x.UserMilestone.CreatedAt,
                x.UserMilestone.UpdatedAt))
            .ToList();

        var xpEventDtos = xpEvents
            .Select(x => new ManagedUserXpEventDataDto(
                x.Id,
                x.SourceType,
                x.SourceId,
                x.XpAmount,
                x.ClientEventId,
                x.IsDeleted,
                x.CreatedAt,
                x.UpdatedAt))
            .ToList();

        var notificationDtos = notifications
            .Select(x => new ManagedUserNotificationDataDto(
                x.Id,
                x.Type,
                x.Title,
                x.Body,
                x.ReferenceType,
                x.ReferenceId,
                x.IsRead,
                x.IsDismissed,
                x.ReadAt,
                x.IsDeleted,
                x.CreatedAt,
                x.UpdatedAt))
            .ToList();

        var subscriptionDtos = subscriptions
            .Select(x => new ManagedUserSubscriptionDataDto(
                x.Id,
                x.PlanId,
                x.Provider,
                x.ProviderReference,
                x.Status,
                x.StartedAt,
                x.ExpiresAt,
                x.AutoRenew,
                x.LastVerifiedAt,
                x.IsDeleted,
                x.CreatedAt,
                x.UpdatedAt))
            .ToList();

        var data = new ManagedUserDataDto(
            user.Adapt<ManagedUserDto>(),
            stats is null
                ? null
                : new UserStatsDto(
                    stats.LessonsCompleted,
                    stats.WordsLearned,
                    stats.CurrentStreak,
                    stats.LongestStreak,
                    stats.LastActiveDate,
                    stats.UpdatedAt),
            palaceDtos,
            lessonDtos,
            progressDtos,
            badgeDtos,
            milestoneDtos,
            xpEventDtos,
            notificationDtos,
            subscriptionDtos);

        return ApiResponse<ManagedUserDataDto>.Ok(data);
    }
}
