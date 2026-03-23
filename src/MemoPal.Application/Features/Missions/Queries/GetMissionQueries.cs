using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Missions.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Missions.Queries;

public sealed record GetMissionTemplatesQuery() : IRequest<ApiResponse<IReadOnlyList<MissionTemplateDto>>>;

public sealed class GetMissionTemplatesQueryHandler
    : IRequestHandler<GetMissionTemplatesQuery, ApiResponse<IReadOnlyList<MissionTemplateDto>>>
{
    private readonly IAppDbContext _db;

    public GetMissionTemplatesQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<MissionTemplateDto>>> Handle(GetMissionTemplatesQuery request, CancellationToken cancellationToken)
    {
        var setting = await _db.SystemSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => !x.IsDeleted && x.Key == SystemSettingKeys.GamificationMissionTemplates,
                cancellationToken);

        var templates = MissionTemplateSerializer.ParseOrDefault(setting?.Value);
        return ApiResponse<IReadOnlyList<MissionTemplateDto>>.Ok(templates);
    }
}

public sealed record GetUserMissionDashboardQuery(string UserId) : IRequest<ApiResponse<UserMissionDashboardDto>>;

public sealed class GetUserMissionDashboardQueryHandler
    : IRequestHandler<GetUserMissionDashboardQuery, ApiResponse<UserMissionDashboardDto>>
{
    private readonly IAppDbContext _db;

    public GetUserMissionDashboardQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<UserMissionDashboardDto>> Handle(GetUserMissionDashboardQuery request, CancellationToken cancellationToken)
    {
        var userExists = await _db.Users
            .AsNoTracking()
            .AnyAsync(x => x.Id == request.UserId && !x.IsDeleted, cancellationToken);
        if (!userExists)
        {
            throw new NotFoundAppException("User not found.");
        }

        var setting = await _db.SystemSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => !x.IsDeleted && x.Key == SystemSettingKeys.GamificationMissionTemplates,
                cancellationToken);

        var templates = MissionTemplateSerializer.ParseOrDefault(setting?.Value)
            .Where(x => x.IsActive)
            .OrderBy(x => x.SortOrder)
            .ToList();

        var now = DateTime.UtcNow;
        var userStats = await _db.UserStats
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == request.UserId, cancellationToken);

        var metricCache = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var missions = new List<MissionProgressDto>(templates.Count);

        foreach (var template in templates)
        {
            var cacheKey = $"{template.MetricType}:{template.Period}";
            if (!metricCache.TryGetValue(cacheKey, out var currentValue))
            {
                currentValue = await ResolveMetricAsync(
                    request.UserId,
                    template.MetricType,
                    template.Period,
                    now,
                    userStats,
                    cancellationToken);
                metricCache[cacheKey] = currentValue;
            }

            var target = Math.Max(1, template.TargetValue);
            var isCompleted = currentValue >= target;
            var percent = Math.Clamp((int)Math.Round(currentValue * 100d / target), 0, 100);

            missions.Add(new MissionProgressDto(
                template.Key,
                template.Title,
                template.Description,
                template.MetricType,
                template.Period,
                currentValue,
                target,
                Math.Max(0, template.RewardXp),
                template.SortOrder,
                template.IsActive,
                isCompleted,
                percent));
        }

        return ApiResponse<UserMissionDashboardDto>.Ok(new UserMissionDashboardDto(now, missions));
    }

    private async Task<int> ResolveMetricAsync(
        string userId,
        string metricType,
        string period,
        DateTime now,
        Domain.Entities.UserStats? userStats,
        CancellationToken cancellationToken)
    {
        var periodStart = GetPeriodStartUtc(period, now);

        return metricType switch
        {
            MissionMetricTypes.ReviewsCompleted => await CountCompletedReviews(userId, periodStart, cancellationToken),
            MissionMetricTypes.LessonsCompleted => await CountCompletedLessons(userId, periodStart, cancellationToken),
            MissionMetricTypes.XpEarned => await SumXpEarned(userId, periodStart, cancellationToken),
            MissionMetricTypes.StreakDays => Math.Max(0, userStats?.CurrentStreak ?? 0),
            MissionMetricTypes.MasteredLessons => await CountMasteredLessons(userId, periodStart, cancellationToken),
            MissionMetricTypes.WordsLearned => Math.Max(0, userStats?.WordsLearned ?? 0),
            _ => 0
        };
    }

    private static DateTime? GetPeriodStartUtc(string period, DateTime now)
    {
        var dayStart = now.Date;
        return period switch
        {
            MissionPeriods.Daily => dayStart,
            MissionPeriods.Weekly => dayStart.AddDays(-(((int)dayStart.DayOfWeek + 6) % 7)),
            _ => null
        };
    }

    private Task<int> CountCompletedReviews(string userId, DateTime? periodStart, CancellationToken cancellationToken)
    {
        var query = _db.ReviewSchedules
            .AsNoTracking()
            .Where(x => x.UserId == userId && !x.IsDeleted && x.Completed);

        if (periodStart.HasValue)
        {
            var start = periodStart.Value;
            query = query.Where(x => x.CompletedDate.HasValue && x.CompletedDate.Value >= start);
        }

        return query.CountAsync(cancellationToken);
    }

    private Task<int> CountCompletedLessons(string userId, DateTime? periodStart, CancellationToken cancellationToken)
    {
        var query = _db.LessonProgresses
            .AsNoTracking()
            .Where(x => x.UserId == userId && !x.IsDeleted && x.FirstCompletedDate.HasValue);

        if (periodStart.HasValue)
        {
            var start = periodStart.Value;
            query = query.Where(x => x.FirstCompletedDate!.Value >= start);
        }

        return query.CountAsync(cancellationToken);
    }

    private async Task<int> SumXpEarned(string userId, DateTime? periodStart, CancellationToken cancellationToken)
    {
        var query = _db.XpEvents
            .AsNoTracking()
            .Where(x => x.UserId == userId && !x.IsDeleted && x.SourceType != "mission_complete");

        if (periodStart.HasValue)
        {
            var start = periodStart.Value;
            query = query.Where(x => x.CreatedAt >= start);
        }

        var total = await query.SumAsync(x => (int?)x.XpAmount, cancellationToken);
        return Math.Max(0, total ?? 0);
    }

    private Task<int> CountMasteredLessons(string userId, DateTime? periodStart, CancellationToken cancellationToken)
    {
        var query = _db.LessonProgresses
            .AsNoTracking()
            .Where(x => x.UserId == userId && !x.IsDeleted && x.MasteryLevel == "mastered");

        if (periodStart.HasValue)
        {
            var start = periodStart.Value;
            query = query.Where(x => x.LastReviewDate.HasValue && x.LastReviewDate.Value >= start);
        }

        return query.CountAsync(cancellationToken);
    }
}
