using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Missions.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Missions.Queries;

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

        var templates = await _db.MissionTemplates
            .AsNoTracking()
            .Where(x => !x.IsDeleted && x.IsActive)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Key)
            .Select(x => new MissionTemplateDto
            {
                Key = x.Key,
                Title = x.Title,
                Description = x.Description,
                MetricType = x.MetricType,
                Period = x.Period,
                TargetValue = x.TargetValue,
                RewardXp = x.RewardXp,
                SortOrder = x.SortOrder,
                IsActive = x.IsActive
            })
            .ToListAsync(cancellationToken);

        if (templates.Count == 0)
        {
            templates = MissionTemplateSerializer.GetDefaultTemplates().ToList();
        }

        var now = DateTime.UtcNow;
        var calculator = new MissionProgressCalculator(_db);
        var userStats = await _db.UserStats
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == request.UserId, cancellationToken);
        var periodTokenByMissionKey = templates.ToDictionary(
            template => template.Key,
            template => MissionProgressCalculator.BuildPeriodToken(template.Period, now),
            StringComparer.OrdinalIgnoreCase);
        var missionKeys = periodTokenByMissionKey.Keys.ToList();
        var missionPeriodTokens = periodTokenByMissionKey.Values.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        var claimedMissionKeys = await _db.UserMissions
            .AsNoTracking()
            .Where(x =>
                x.UserId == request.UserId &&
                !x.IsDeleted &&
                x.RewardClaimedAt.HasValue &&
                missionKeys.Contains(x.MissionKey) &&
                missionPeriodTokens.Contains(x.PeriodToken))
            .Select(x => new { x.MissionKey, x.PeriodToken })
            .ToListAsync(cancellationToken);
        var claimedMissionLookup = claimedMissionKeys
            .Select(x => $"{x.MissionKey}|{x.PeriodToken}")
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

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
                    calculator,
                    cancellationToken);
                metricCache[cacheKey] = currentValue;
            }

            var target = Math.Max(1, template.TargetValue);
            var isCompleted = currentValue >= target;
            var percent = Math.Clamp((int)Math.Round(currentValue * 100d / target), 0, 100);
            var periodToken = periodTokenByMissionKey[template.Key];
            var isClaimed = claimedMissionLookup.Contains($"{template.Key}|{periodToken}");

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
                percent,
                isClaimed));
        }

        return ApiResponse<UserMissionDashboardDto>.Ok(new UserMissionDashboardDto(now, missions));
    }

    private static async Task<int> ResolveMetricAsync(
        string userId,
        string metricType,
        string period,
        DateTime now,
        Domain.Entities.UserStats? userStats,
        MissionProgressCalculator calculator,
        CancellationToken cancellationToken)
    {
        return await calculator.ResolveMetricAsync(userId, metricType, period, now, userStats, cancellationToken);
    }
}
