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

public sealed record GetGamificationMobileUiConfigQuery() : IRequest<ApiResponse<GamificationMobileUiConfigDto>>;

public sealed class GetGamificationMobileUiConfigQueryHandler
    : IRequestHandler<GetGamificationMobileUiConfigQuery, ApiResponse<GamificationMobileUiConfigDto>>
{
    private readonly IAppDbContext _db;

    public GetGamificationMobileUiConfigQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<GamificationMobileUiConfigDto>> Handle(
        GetGamificationMobileUiConfigQuery request,
        CancellationToken cancellationToken)
    {
        var setting = await _db.SystemSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => !x.IsDeleted && x.Key == SystemSettingKeys.GamificationMobileUiConfig,
                cancellationToken);

        var config = GamificationMobileUiConfigSerializer.ParseOrDefault(setting?.Value);
        return ApiResponse<GamificationMobileUiConfigDto>.Ok(config);
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
        var calculator = new MissionProgressCalculator(_db);
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
                    calculator,
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
        MissionProgressCalculator calculator,
        CancellationToken cancellationToken)
    {
        return await calculator.ResolveMetricAsync(userId, metricType, period, now, userStats, cancellationToken);
    }
}
