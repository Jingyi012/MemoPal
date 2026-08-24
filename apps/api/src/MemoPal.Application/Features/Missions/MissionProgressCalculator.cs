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
            MissionMetricTypes.ReviewsCompleted => await CountCompletedPracticeAttempts(userId, periodStart, cancellationToken),
            MissionMetricTypes.LessonsCompleted => await CountPractisedMemorySets(userId, periodStart, cancellationToken),
            MissionMetricTypes.XpEarned => await SumXpEarned(userId, periodStart, cancellationToken),
            MissionMetricTypes.StreakDays => Math.Max(0, userStats?.CurrentStreak ?? 0),
            MissionMetricTypes.MasteredLessons => await CountMasteredMemorySets(userId, periodStart, cancellationToken),
            MissionMetricTypes.WordsLearned => await CountMemoryItems(userId, cancellationToken),
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

    private Task<int> CountCompletedPracticeAttempts(string userId, DateTime? periodStart, CancellationToken cancellationToken)
    {
        var query = _db.PracticeAttempts
            .AsNoTracking()
            .Where(x => x.UserId == userId && !x.IsDeleted);

        if (periodStart.HasValue)
        {
            var start = periodStart.Value;
            query = query.Where(x => x.CompletedAt >= start);
        }

        return query.CountAsync(cancellationToken);
    }

    private Task<int> CountPractisedMemorySets(string userId, DateTime? periodStart, CancellationToken cancellationToken)
    {
        var query = _db.PracticeAttempts
            .AsNoTracking()
            .Where(x => x.UserId == userId && !x.IsDeleted);

        if (periodStart.HasValue)
        {
            var start = periodStart.Value;
            query = query.Where(x => x.CompletedAt >= start);
        }

        return query.Select(x => x.MemorySetId).Distinct().CountAsync(cancellationToken);
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

    private Task<int> CountMasteredMemorySets(string userId, DateTime? periodStart, CancellationToken cancellationToken)
    {
        var query = _db.MemoryReviewSchedules
            .AsNoTracking()
            .Where(x => x.UserId == userId && !x.IsDeleted && x.ReviewCount >= 3 && x.LastResultCorrect);

        if (periodStart.HasValue)
        {
            var start = periodStart.Value;
            query = query.Where(x => x.UpdatedAt >= start);
        }

        return query.Select(x => x.MemorySetId).Distinct().CountAsync(cancellationToken);
    }

    private Task<int> CountMemoryItems(string userId, CancellationToken cancellationToken) =>
        _db.MemoryItems
            .AsNoTracking()
            .Where(x => !x.IsDeleted && x.MemorySet != null && x.MemorySet.UserId == userId)
            .CountAsync(cancellationToken);
}

