using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Leaderboards.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Leaderboards.Queries;

public sealed record GetCurrentCommunityLeaderboardQuery(string UserId)
    : IRequest<ApiResponse<CurrentCommunityLeaderboardDto>>;

public sealed class GetCurrentCommunityLeaderboardQueryHandler(IAppDbContext db)
    : IRequestHandler<GetCurrentCommunityLeaderboardQuery, ApiResponse<CurrentCommunityLeaderboardDto>>
{
    private const int VisibleRows = 100;
    private const int VisibleNeighborsEachSide = 2;

    public async Task<ApiResponse<CurrentCommunityLeaderboardDto>> Handle(
        GetCurrentCommunityLeaderboardQuery request,
        CancellationToken cancellationToken)
    {
        var rawConfig = await db.SystemSettings.AsNoTracking()
            .Where(x => !x.IsDeleted && x.Key == SystemSettingKeys.LeaderboardCatalog)
            .Select(x => x.Value)
            .FirstOrDefaultAsync(cancellationToken);
        var currentBoard = LeaderboardCatalogSerializer.ParseOrDefault(rawConfig).Boards
            .Single(x => x.Id == "community-weekly");
        if (!currentBoard.Enabled)
            throw new NotFoundAppException("Leaderboard not found.");

        var now = DateTime.UtcNow;
        var season = await LeaderboardSeasonLifecycle.GetOrCreateCurrentAsync(
            db, currentBoard, now, cancellationToken);
        var board = LeaderboardSeasonLifecycle.ReadBoard(season);
        if (!board.Enabled)
            throw new NotFoundAppException("Leaderboard not found.");
        var weekStart = season.WeekStartsAtUtc;
        var weekEnd = season.WeekEndsAtUtc;
        var user = await db.Users.AsNoTracking().Where(x => x.Id == request.UserId && !x.IsDeleted)
            .Select(x => new { x.Id, x.CommunityLeaderboardOptIn, x.CommunityLeaderboardJoinedAtUtc })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundAppException("User not found.");

        var optedInUsers = await db.Users.AsNoTracking()
            .Where(x => !x.IsDeleted && x.CommunityLeaderboardOptIn &&
                        x.CommunityLeaderboardJoinedAtUtc != null &&
                        x.CommunityLeaderboardJoinedAtUtc < weekEnd)
            .Select(x => new { x.Id, x.CommunityLeaderboardJoinedAtUtc })
            .ToListAsync(cancellationToken);
        foreach (var participant in optedInUsers)
        {
            await LeaderboardSeasonLifecycle.EnsureParticipantAsync(
                db, season, participant.Id, participant.CommunityLeaderboardJoinedAtUtc!.Value, now, cancellationToken);
        }
        if (optedInUsers.Count > 0)
            await db.SaveChangesAsync(cancellationToken);
        var participantCount = optedInUsers.Count;
        var scoreUsers = optedInUsers.ToDictionary(x => x.Id, x => x.CommunityLeaderboardJoinedAtUtc!.Value);
        if (user.CommunityLeaderboardOptIn && user.CommunityLeaderboardJoinedAtUtc is { } joinedAt)
            scoreUsers[user.Id] = joinedAt > weekStart ? joinedAt : weekStart;
        else
            scoreUsers[user.Id] = weekStart;

        var userIds = scoreUsers.Keys.ToArray();
        var itemActivityRows = await db.PracticeResponses.AsNoTracking()
            .Where(x => !x.IsDeleted && x.PracticeAttempt != null && !x.PracticeAttempt.IsDeleted &&
                        x.PracticeAttempt.Mode == PracticeModes.Recall &&
                        x.PracticeAttempt.CompletedAt >= weekStart && x.PracticeAttempt.CompletedAt < weekEnd &&
                        userIds.Contains(x.PracticeAttempt.UserId))
            .GroupBy(x => new
            {
                UserId = x.PracticeAttempt!.UserId,
                Day = x.PracticeAttempt.CompletedAt.Date,
                ActivityItemId = x.MemoryItem != null && x.MemoryItem.OriginMemoryItemId != null
                    ? x.MemoryItem.OriginMemoryItemId
                    : x.MemoryItemId
            })
            .Select(group => new
            {
                group.Key.UserId,
                group.Key.Day,
                group.Key.ActivityItemId,
                LastRecallAt = group.Max(x => x.PracticeAttempt!.CompletedAt),
                LastDueRecallAt = group.Where(x => x.WasDueAtSubmission)
                    .Select(x => (DateTime?)x.PracticeAttempt!.CompletedAt)
                    .Max(),
            })
            .ToListAsync(cancellationToken);

        // The query above collapses repeated attempts to one row per user/day/canonical item
        // in SQL. Max timestamps retain the exact mid-week opt-in cutoff semantics below.
        var dailyPoints = itemActivityRows
            .Where(x => scoreUsers.TryGetValue(x.UserId, out var joinedAt) && x.LastRecallAt >= joinedAt)
            .Select(x => new
            {
                x.UserId,
                x.Day,
                Due = scoreUsers.TryGetValue(x.UserId, out var joinedAt) &&
                      x.LastDueRecallAt is { } dueAt && dueAt >= joinedAt,
            })
            .GroupBy(x => (UserId: x.UserId, Day: x.Day))
            .ToDictionary(
                group => group.Key,
                group => (RecallCount: group.Count(), DueCount: group.Count(x => x.Due)));

        var userScores = dailyPoints.GroupBy(x => x.Key.UserId).ToDictionary(
            group => group.Key,
            group => group.Sum(day => LeaderboardScoringCalculator.CalculateDailyScore(
                day.Value.RecallCount, day.Value.DueCount, board.Tasks)));
        var activeDaysByUser = dailyPoints.Keys.GroupBy(x => x.UserId)
            .ToDictionary(group => group.Key, group => group.Count(), StringComparer.Ordinal);
        var myActiveDays = activeDaysByUser.GetValueOrDefault(user.Id);
        var personalGoalScore = dailyPoints.Where(x => x.Key.UserId == user.Id)
            .Where(x => x.Key.Day >= weekStart && x.Key.Day < weekEnd)
            .Sum(x => LeaderboardScoringCalculator.CalculateDailyScore(
                x.Value.RecallCount, x.Value.DueCount, board.Tasks));
        var todayProgress = dailyPoints.GetValueOrDefault((UserId: user.Id, Day: now.Date));
        var todayTasks = board.Tasks.Select(task =>
        {
            var currentValue = task.Metric == LeaderboardTaskMetrics.DistinctRecallItems
                ? todayProgress.RecallCount
                : todayProgress.DueCount;
            return new LeaderboardTaskProgressDto(
                task.Id, task.SortOrder, task.Metric, task.Threshold, task.Points,
                task.TitleEn, task.TitleZh, currentValue, currentValue >= task.Threshold);
        }).ToArray();
        if (!user.CommunityLeaderboardOptIn)
            return ApiResponse<CurrentCommunityLeaderboardDto>.Ok(new CurrentCommunityLeaderboardDto(
                false, weekStart, weekEnd, participantCount, personalGoalScore, null, null, [], board, todayTasks,
                myActiveDays, null, await GetLatestRewardAsync(db, user.Id, weekStart, cancellationToken)));

        var rankedUsers = optedInUsers
            .Select(x => (x.Id, Score: userScores.GetValueOrDefault(x.Id)))
            .OrderByDescending(x => x.Score)
            .ThenBy(x => x.Id, StringComparer.Ordinal)
            .ToList();
        var rankByUser = new Dictionary<string, int>(StringComparer.Ordinal);
        var previousScore = -1;
        var currentRank = 0;
        for (var index = 0; index < rankedUsers.Count; index++)
        {
            var row = rankedUsers[index];
            if (row.Score != previousScore) currentRank = index + 1;
            rankByUser[row.Id] = currentRank;
            previousScore = row.Score;
        }

        int? myRank = rankByUser.TryGetValue(user.Id, out var foundRank) ? foundRank : null;
        var projectedCreditsByUser = LeaderboardRewardCalculator.CalculateCredits(
            rankedUsers.Select(x => new LeaderboardRewardStanding(
                x.Id, x.Score, activeDaysByUser.GetValueOrDefault(x.Id))).ToArray(),
            board.Rewards ?? LeaderboardRewardConfigDto.CreateDefault(false));
        var myProjectedCredits = projectedCreditsByUser.GetValueOrDefault(user.Id);
        var visibleUsers = rankedUsers.Take(VisibleRows).ToList();
        if (myRank is not null && visibleUsers.All(x => x.Id != user.Id))
        {
            // Rank numbers can be shared when users tie. Use the user's ordered position
            // to include the correct nearby rows beyond the visible top 100.
            var currentIndex = rankedUsers.FindIndex(x => x.Id == user.Id);
            var neighborhoodStart = Math.Max(0, currentIndex - VisibleNeighborsEachSide);
            var neighborhoodCount = Math.Min(rankedUsers.Count, currentIndex + VisibleNeighborsEachSide + 1) - neighborhoodStart;
            visibleUsers.AddRange(rankedUsers.Skip(neighborhoodStart).Take(neighborhoodCount));
            visibleUsers = visibleUsers
                .DistinctBy(x => x.Id)
                .OrderBy(x => rankByUser[x.Id])
                .ToList();
        }
        var entries = visibleUsers.Select(x => new CommunityLeaderboardEntryDto(
            rankByUser[x.Id], x.Id == user.Id ? "You" : $"Learner {rankedUsers.FindIndex(row => row.Id == x.Id) + 1}",
            x.Score, x.Id == user.Id)).ToList();

        return ApiResponse<CurrentCommunityLeaderboardDto>.Ok(new CurrentCommunityLeaderboardDto(
            true, weekStart, weekEnd, participantCount, personalGoalScore,
            userScores.GetValueOrDefault(user.Id), myRank, entries, board, todayTasks,
            myActiveDays, myProjectedCredits, await GetLatestRewardAsync(db, user.Id, weekStart, cancellationToken)));
    }

    private static async Task<LeaderboardRewardResultDto?> GetLatestRewardAsync(
        IAppDbContext db,
        string userId,
        DateTime currentWeekStartsAtUtc,
        CancellationToken cancellationToken)
    {
        var latest = await (
            from participant in db.LeaderboardSeasonParticipants.AsNoTracking()
            join season in db.LeaderboardSeasons.AsNoTracking() on participant.SeasonId equals season.Id
            where !participant.IsDeleted && participant.UserId == userId &&
                  !season.IsDeleted && season.LeaderboardId == "community-weekly" &&
                  season.WeekStartsAtUtc < currentWeekStartsAtUtc
            orderby season.WeekStartsAtUtc descending
            select new { Participant = participant, Season = season })
            .FirstOrDefaultAsync(cancellationToken);

        if (latest is null) return null;

        var frozenBoard = LeaderboardSeasonLifecycle.ReadBoard(latest.Season);
        return new LeaderboardRewardResultDto(
            latest.Season.WeekStartsAtUtc,
            latest.Season.WeekEndsAtUtc,
            latest.Participant.FinalRank,
            latest.Participant.FinalScore,
            latest.Participant.ActiveDays,
            latest.Participant.RewardCredits,
            latest.Participant.RewardStatus,
            latest.Participant.RewardExpiresAtUtc,
            latest.Season.Status,
            frozenBoard.Rewards?.Enabled == true,
            frozenBoard.Rewards?.MinimumActiveDays ?? 3,
            GetQualificationReason(
                latest.Participant,
                latest.Season,
                frozenBoard.Rewards?.Enabled == true,
                frozenBoard.Rewards?.MinimumActiveDays ?? 3));
    }

    private static string? GetQualificationReason(
        LeaderboardSeasonParticipant participant,
        LeaderboardSeason season,
        bool rewardsEnabled,
        int minimumActiveDays)
    {
        if (participant.RewardStatus == LeaderboardRewardStatuses.NotEligible)
        {
            if (participant.OptedOutAtUtc is not null && participant.OptedOutAtUtc < season.WeekEndsAtUtc)
                return "opted-out";
            return participant.ActiveDays < minimumActiveDays ? "minimum-active-days" : "not-qualified";
        }

        if (participant.RewardStatus == LeaderboardRewardStatuses.OutsideRewardRanks)
            return "outside-reward-ranks";
        if (participant.RewardStatus == LeaderboardRewardStatuses.NoReward)
            return rewardsEnabled ? "no-credit-after-tie-split" : "rewards-disabled";
        return participant.RewardStatus is LeaderboardRewardStatuses.Pending or LeaderboardRewardStatuses.Awarded
            ? "qualified"
            : null;
    }

}
