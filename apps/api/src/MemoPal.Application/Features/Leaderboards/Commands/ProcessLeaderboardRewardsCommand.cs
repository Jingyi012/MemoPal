using MediatR;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Leaderboards.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MemoPal.Application.Features.Leaderboards.Commands;

public sealed record ProcessLeaderboardRewardsCommand(DateTime NowUtc) : IRequest<int>;

public sealed class ProcessLeaderboardRewardsCommandHandler(
    IAppDbContext db,
    IAiCredits credits,
    ILogger<ProcessLeaderboardRewardsCommandHandler> logger)
    : IRequestHandler<ProcessLeaderboardRewardsCommand, int>
{
    private static readonly TimeSpan ReviewWindow = TimeSpan.FromHours(24);

    public async Task<int> Handle(ProcessLeaderboardRewardsCommand request, CancellationToken cancellationToken)
    {
        if (request.NowUtc.Kind != DateTimeKind.Utc)
            throw new ArgumentException("Leaderboard reward processing requires a UTC timestamp.", nameof(request));

        await EnsureCurrentSeasonParticipantsAsync(request.NowUtc, cancellationToken);

        var cutoff = request.NowUtc - ReviewWindow;
        var dueSeasons = await db.LeaderboardSeasons
            .Where(x => !x.IsDeleted && x.LeaderboardId == "community-weekly" &&
                        x.Status != LeaderboardSeasonStatuses.Settled && x.WeekEndsAtUtc <= cutoff)
            .OrderBy(x => x.WeekStartsAtUtc)
            .Take(8)
            .ToListAsync(cancellationToken);

        var issued = 0;
        foreach (var season in dueSeasons)
            issued += await ProcessSeasonAsync(season.Id, request.NowUtc, cancellationToken);

        return issued;
    }

    private async Task EnsureCurrentSeasonParticipantsAsync(DateTime nowUtc, CancellationToken cancellationToken)
    {
        var rawConfig = await db.SystemSettings.AsNoTracking()
            .Where(x => !x.IsDeleted && x.Key == SystemSettingKeys.LeaderboardCatalog)
            .Select(x => x.Value)
            .FirstOrDefaultAsync(cancellationToken);
        var board = LeaderboardCatalogSerializer.ParseOrDefault(rawConfig).Boards
            .Single(x => x.Id == "community-weekly");
        if (!board.Enabled) return;

        var season = await LeaderboardSeasonLifecycle.GetOrCreateCurrentAsync(db, board, nowUtc, cancellationToken);
        var optedInUsers = await db.Users.AsNoTracking()
            .Where(x => !x.IsDeleted && x.CommunityLeaderboardOptIn && x.CommunityLeaderboardJoinedAtUtc != null)
            .Select(x => new { x.Id, x.CommunityLeaderboardJoinedAtUtc })
            .ToListAsync(cancellationToken);
        foreach (var user in optedInUsers)
            await LeaderboardSeasonLifecycle.EnsureParticipantAsync(
                db, season, user.Id, user.CommunityLeaderboardJoinedAtUtc!.Value, nowUtc, cancellationToken);
        if (optedInUsers.Count > 0) await db.SaveChangesAsync(cancellationToken);
    }

    private async Task<int> ProcessSeasonAsync(string seasonId, DateTime nowUtc, CancellationToken cancellationToken)
    {
        var season = await db.LeaderboardSeasons.FirstAsync(x => x.Id == seasonId, cancellationToken);
        if (season.Status == LeaderboardSeasonStatuses.Open)
            await CalculateAndFreezeResultsAsync(season, nowUtc, cancellationToken);

        var awards = await db.LeaderboardSeasonParticipants
            .Where(x => !x.IsDeleted && x.SeasonId == season.Id &&
                        (x.RewardStatus == LeaderboardRewardStatuses.Pending ||
                         x.RewardStatus == LeaderboardRewardStatuses.Failed))
            .OrderBy(x => x.FinalRank)
            .ThenBy(x => x.UserId)
            .Select(x => new { x.Id, x.UserId, x.RewardCredits, x.RewardExpiresAtUtc })
            .ToListAsync(cancellationToken);

        var issued = 0;
        foreach (var award in awards)
        {
            try
            {
                var reference = $"leaderboard:{season.LeaderboardId}:{season.WeekStartsAtUtc:yyyyMMdd}:{award.UserId}";
                await credits.GrantAsync(award.UserId, reference, "leaderboard", award.RewardCredits,
                    award.RewardExpiresAtUtc, cancellationToken);
                db.ClearTracking();
                var participant = await db.LeaderboardSeasonParticipants.FirstAsync(x => x.Id == award.Id, cancellationToken);
                participant.RewardStatus = LeaderboardRewardStatuses.Awarded;
                participant.RewardedAtUtc = nowUtc;
                participant.RewardFailureCode = null;
                await db.SaveChangesAsync(cancellationToken);
                issued++;
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                db.ClearTracking();
                var participant = await db.LeaderboardSeasonParticipants.FirstAsync(x => x.Id == award.Id, cancellationToken);
                participant.RewardStatus = LeaderboardRewardStatuses.Failed;
                participant.RewardAttempts++;
                participant.RewardLastAttemptAtUtc = nowUtc;
                participant.RewardFailureCode = ex.GetType().Name.Length <= 64
                    ? ex.GetType().Name
                    : ex.GetType().Name[..64];
                await db.SaveChangesAsync(cancellationToken);
                logger.LogWarning("Leaderboard reward grant failed. FailureType={FailureType}", ex.GetType().Name);
            }
        }

        db.ClearTracking();
        var hasOutstandingRewards = await db.LeaderboardSeasonParticipants.AnyAsync(x =>
            !x.IsDeleted && x.SeasonId == seasonId &&
            (x.RewardStatus == LeaderboardRewardStatuses.Open ||
             x.RewardStatus == LeaderboardRewardStatuses.Pending ||
             x.RewardStatus == LeaderboardRewardStatuses.Failed), cancellationToken);
        if (!hasOutstandingRewards)
        {
            var completedSeason = await db.LeaderboardSeasons.FirstAsync(x => x.Id == seasonId, cancellationToken);
            completedSeason.Status = LeaderboardSeasonStatuses.Settled;
            completedSeason.SettledAtUtc = nowUtc;
            await db.SaveChangesAsync(cancellationToken);
        }

        return issued;
    }

    private async Task CalculateAndFreezeResultsAsync(
        LeaderboardSeason season,
        DateTime nowUtc,
        CancellationToken cancellationToken)
    {
        var board = LeaderboardSeasonLifecycle.ReadBoard(season);
        var participants = await db.LeaderboardSeasonParticipants
            .Where(x => !x.IsDeleted && x.SeasonId == season.Id)
            .ToListAsync(cancellationToken);
        var activeParticipants = participants.Where(x =>
            x.OptedOutAtUtc is null || x.OptedOutAtUtc >= season.WeekEndsAtUtc).ToList();
        var candidateIds = activeParticipants.Select(x => x.UserId).Distinct().ToArray();
        var activeUserIds = candidateIds.Length == 0
            ? new HashSet<string>(StringComparer.Ordinal)
            : await db.Users.AsNoTracking()
                .Where(x => !x.IsDeleted && candidateIds.Contains(x.Id))
                .Select(x => x.Id)
                .ToHashSetAsync(cancellationToken);
        activeParticipants = activeParticipants.Where(x => activeUserIds.Contains(x.UserId)).ToList();

        var dailyPoints = await GetDailyPointsAsync(season, participants, cancellationToken);
        var scores = participants.ToDictionary(x => x.UserId, _ => 0, StringComparer.Ordinal);
        var activeDays = participants.ToDictionary(x => x.UserId, _ => 0, StringComparer.Ordinal);
        foreach (var group in dailyPoints.GroupBy(x => x.Key.UserId))
        {
            scores[group.Key] = group.Sum(day => LeaderboardScoringCalculator.CalculateDailyScore(
                day.Value.RecallCount, day.Value.DueCount, board.Tasks));
            activeDays[group.Key] = group.Count();
        }

        var ranked = activeParticipants
            .Select(x => (Participant: x, Score: scores.GetValueOrDefault(x.UserId)))
            .OrderByDescending(x => x.Score)
            .ThenBy(x => x.Participant.UserId, StringComparer.Ordinal)
            .ToList();
        var ranks = new Dictionary<string, int>(StringComparer.Ordinal);
        var previousScore = -1;
        var rank = 0;
        for (var index = 0; index < ranked.Count; index++)
        {
            if (ranked[index].Score != previousScore) rank = index + 1;
            ranks[ranked[index].Participant.UserId] = rank;
            previousScore = ranked[index].Score;
        }

        var awards = LeaderboardRewardCalculator.CalculateCredits(
            ranked.Select(x => new LeaderboardRewardStanding(
                x.Participant.UserId, x.Score, activeDays.GetValueOrDefault(x.Participant.UserId))).ToArray(),
            board.Rewards ?? LeaderboardRewardConfigDto.CreateDefault(false));

        foreach (var participant in participants)
        {
            participant.FinalScore = scores.GetValueOrDefault(participant.UserId);
            participant.ActiveDays = activeDays.GetValueOrDefault(participant.UserId);
            participant.FinalRank = ranks.GetValueOrDefault(participant.UserId);
            participant.RewardCredits = 0;
            participant.RewardExpiresAtUtc = null;
            participant.RewardFailureCode = null;

            if (participant.FinalRank is null || participant.ActiveDays < (board.Rewards?.MinimumActiveDays ?? 3))
            {
                participant.RewardStatus = LeaderboardRewardStatuses.NotEligible;
                continue;
            }
            if (participant.FinalRank > 100)
            {
                participant.RewardStatus = LeaderboardRewardStatuses.OutsideRewardRanks;
                continue;
            }
            if (board.Rewards?.Enabled != true)
            {
                participant.RewardStatus = LeaderboardRewardStatuses.NoReward;
                continue;
            }

            var amount = awards.GetValueOrDefault(participant.UserId);
            if (amount < 1)
            {
                participant.RewardStatus = LeaderboardRewardStatuses.NoReward;
                continue;
            }

            participant.RewardCredits = amount;
            participant.RewardExpiresAtUtc = DateTime.SpecifyKind(
                nowUtc.AddDays(board.Rewards.ExpiryDays), DateTimeKind.Utc);
            participant.RewardStatus = LeaderboardRewardStatuses.Pending;
        }

        season.Status = LeaderboardSeasonStatuses.Settling;
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task<Dictionary<(string UserId, DateTime Day), (int RecallCount, int DueCount)>> GetDailyPointsAsync(
        LeaderboardSeason season,
        IReadOnlyCollection<LeaderboardSeasonParticipant> participants,
        CancellationToken cancellationToken)
    {
        var participantIds = participants.Select(x => x.UserId).Distinct().ToArray();
        if (participantIds.Length == 0)
            return [];

        var itemActivityRows = await db.PracticeResponses.AsNoTracking()
            .Where(x => !x.IsDeleted && x.PracticeAttempt != null && !x.PracticeAttempt.IsDeleted &&
                        x.PracticeAttempt.Mode == PracticeModes.Recall &&
                        x.PracticeAttempt.CompletedAt >= season.WeekStartsAtUtc &&
                        x.PracticeAttempt.CompletedAt < season.WeekEndsAtUtc &&
                        participantIds.Contains(x.PracticeAttempt.UserId))
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
                LastRecallAt = group.Max(x => x.PracticeAttempt!.CompletedAt),
                LastDueRecallAt = group.Where(x => x.WasDueAtSubmission)
                    .Select(x => (DateTime?)x.PracticeAttempt!.CompletedAt)
                    .Max()
            })
            .ToListAsync(cancellationToken);

        var joinedAtByUser = participants.ToDictionary(x => x.UserId, x => x.JoinedAtUtc, StringComparer.Ordinal);
        return itemActivityRows
            .Where(x => joinedAtByUser.TryGetValue(x.UserId, out var joinedAt) && x.LastRecallAt >= joinedAt)
            .Select(x => new
            {
                x.UserId,
                x.Day,
                Due = joinedAtByUser.TryGetValue(x.UserId, out var joinedAt) &&
                      x.LastDueRecallAt is { } dueAt && dueAt >= joinedAt
            })
            .GroupBy(x => (x.UserId, x.Day))
            .ToDictionary(group => group.Key, group => (group.Count(), group.Count(x => x.Due)));
    }
}
