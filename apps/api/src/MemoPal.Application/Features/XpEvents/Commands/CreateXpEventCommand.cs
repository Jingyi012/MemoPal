using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Missions;
using MemoPal.Application.Features.XpEvents.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.XpEvents.Commands;

public sealed record CreateXpEventCommand(string UserId, XpEventUpsertRequest Request) : IRequest<ApiResponse<XpEventDto>>;

public sealed class CreateXpEventCommandHandler : IRequestHandler<CreateXpEventCommand, ApiResponse<XpEventDto>>
{
    private const string MissionCompleteSourceType = "mission_complete";
    private readonly IAppDbContext _db;

    public CreateXpEventCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<XpEventDto>> Handle(CreateXpEventCommand request, CancellationToken cancellationToken)
    {
        var payload = request.Request
            ?? throw new ValidationAppException("sourceType and clientEventId are required.");

        if (string.IsNullOrWhiteSpace(payload.SourceType) ||
            string.IsNullOrWhiteSpace(payload.ClientEventId))
        {
            throw new ValidationAppException("sourceType and clientEventId are required.");
        }

        if (payload.XpAmount <= 0)
        {
            throw new ValidationAppException("xpAmount must be greater than 0.");
        }

        var existing = await _db.XpEvents.FirstOrDefaultAsync(
            x => x.UserId == request.UserId &&
                 x.ClientEventId == payload.ClientEventId,
            cancellationToken);

        if (existing is not null)
        {
            return ApiResponse<XpEventDto>.Ok(existing.Adapt<XpEventDto>());
        }

        var now = DateTime.UtcNow;
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == request.UserId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("User not found.");
        UserMission? missionClaimRecord = null;

        if (string.Equals(payload.SourceType, MissionCompleteSourceType, StringComparison.OrdinalIgnoreCase))
        {
            missionClaimRecord = await BuildMissionClaimRecordAsync(request.UserId, payload, now, cancellationToken);
        }

        var entity = new XpEvent
        {
            Id = string.IsNullOrWhiteSpace(payload.Id) ? Guid.NewGuid().ToString("D") : payload.Id!,
            UserId = request.UserId,
            SourceType = payload.SourceType,
            SourceId = payload.SourceId,
            XpAmount = payload.XpAmount,
            ClientEventId = payload.ClientEventId,
            IsDeleted = false,
            CreatedAt = now,
            UpdatedAt = now
        };

        user.TotalXp += entity.XpAmount;
        user.Level = await _db.ResolveLevelByXpAsync(user.TotalXp, cancellationToken);
        user.UpdatedAt = now;

        if (missionClaimRecord is not null)
        {
            _db.UserMissions.Add(missionClaimRecord);
        }

        await _db.XpEvents.AddAsync(entity, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        return ApiResponse<XpEventDto>.Ok(entity.Adapt<XpEventDto>());
    }

    private async Task<UserMission> BuildMissionClaimRecordAsync(
        string userId,
        XpEventUpsertRequest payload,
        DateTime now,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(payload.SourceId) || !TryParseMissionSourceId(payload.SourceId, out var missionKey, out var periodToken))
        {
            throw new ValidationAppException("Invalid mission sourceId format.");
        }

        var missionTemplate = await _db.MissionTemplates
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => !x.IsDeleted &&
                     x.IsActive &&
                     x.Key == missionKey,
                cancellationToken)
            ?? throw new ValidationAppException("Mission template not found.");

        var expectedPeriodToken = MissionProgressCalculator.BuildPeriodToken(missionTemplate.Period, now);
        if (!string.Equals(periodToken, expectedPeriodToken, StringComparison.OrdinalIgnoreCase))
        {
            throw new ValidationAppException("Mission period is invalid or expired.");
        }

        var hasClaimed = await _db.UserMissions
            .AnyAsync(
                x => x.UserId == userId &&
                     x.MissionKey == missionTemplate.Key &&
                     x.PeriodToken == periodToken &&
                     !x.IsDeleted,
                cancellationToken);
        if (hasClaimed)
        {
            throw new ValidationAppException("Mission reward already claimed for this period.");
        }

        var expectedRewardXp = Math.Max(0, missionTemplate.RewardXp);
        if (payload.XpAmount != expectedRewardXp)
        {
            throw new ValidationAppException("Mission reward XP does not match configured mission reward.");
        }

        var userStats = await _db.UserStats
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);
        var calculator = new MissionProgressCalculator(_db);
        var currentValue = await calculator.ResolveMetricAsync(
            userId,
            missionTemplate.MetricType,
            missionTemplate.Period,
            now,
            userStats,
            cancellationToken);
        var targetValue = Math.Max(1, missionTemplate.TargetValue);
        if (currentValue < targetValue)
        {
            throw new ValidationAppException("Mission is not completed yet.");
        }

        return new UserMission
        {
            Id = Guid.NewGuid().ToString("D"),
            UserId = userId,
            MissionKey = missionTemplate.Key,
            Period = missionTemplate.Period,
            PeriodToken = periodToken,
            TargetValue = targetValue,
            CurrentValue = currentValue,
            RewardXp = expectedRewardXp,
            CompletedAt = now,
            RewardClaimedAt = now,
            IsDeleted = false,
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    private static bool TryParseMissionSourceId(string sourceId, out string missionKey, out string periodToken)
    {
        missionKey = string.Empty;
        periodToken = string.Empty;

        var firstSeparator = sourceId.IndexOf(':');
        if (firstSeparator <= 0 || firstSeparator + 1 >= sourceId.Length)
        {
            return false;
        }

        missionKey = sourceId[..firstSeparator].Trim();
        periodToken = sourceId[(firstSeparator + 1)..].Trim();
        return !string.IsNullOrWhiteSpace(missionKey) && !string.IsNullOrWhiteSpace(periodToken);
    }
}
