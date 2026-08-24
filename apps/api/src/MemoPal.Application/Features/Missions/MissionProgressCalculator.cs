using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Missions.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Missions;

internal sealed class MissionProgressCalculator
{
    private readonly IAppDbContext _db;

    public MissionProgressCalculator(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<int> ResolveMetricAsync(
        string userId,
        string metricType,
        string period,
        DateTime now,
        UserStats? userStats,
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

    public static DateTime? GetPeriodStartUtc(string period, DateTime now)
    {
        var dayStart = now.Date;
        return period switch
        {
            MissionPeriods.Daily => dayStart,
            MissionPeriods.Weekly => dayStart.AddDays(-(((int)dayStart.DayOfWeek + 6) % 7)),
            _ => null
        };
    }

    public static string BuildPeriodToken(string period, DateTime now)
    {
        static string DateToken(DateTime value) => value.ToString("yyyy-MM-dd");

        var normalizedPeriod = period.Trim().ToLowerInvariant();
        if (normalizedPeriod == MissionPeriods.Daily)
        {
            return $"day:{DateToken(now.Date)}";
        }

        if (normalizedPeriod == MissionPeriods.Weekly)
        {
            var weekStart = now.Date.AddDays(-(((int)now.Date.DayOfWeek + 6) % 7));
            return $"week:{DateToken(weekStart)}";
        }

        return "all-time";
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

