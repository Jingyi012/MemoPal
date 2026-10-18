using System.Text.Json;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Leaderboards.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Leaderboards;

public static class LeaderboardSeasonLifecycle
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static async Task<LeaderboardSeason> GetOrCreateCurrentAsync(
        IAppDbContext db,
        LeaderboardBoardDefinitionDto currentBoard,
        DateTime nowUtc,
        CancellationToken cancellationToken)
    {
        var weekStart = GetWeekStart(nowUtc);
        var existing = await db.LeaderboardSeasons.FirstOrDefaultAsync(x =>
                !x.IsDeleted && x.LeaderboardId == currentBoard.Id && x.WeekStartsAtUtc == weekStart,
            cancellationToken);
        if (existing is not null) return existing;

        var season = new LeaderboardSeason
        {
            Id = Guid.NewGuid().ToString("N"),
            LeaderboardId = currentBoard.Id,
            WeekStartsAtUtc = weekStart,
            WeekEndsAtUtc = weekStart.AddDays(7),
            ConfigJson = JsonSerializer.Serialize(currentBoard, JsonOptions),
            Status = LeaderboardSeasonStatuses.Open
        };
        db.LeaderboardSeasons.Add(season);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            return season;
        }
        catch (DbUpdateException)
        {
            db.ClearTracking();
            return await db.LeaderboardSeasons.FirstAsync(x =>
                !x.IsDeleted && x.LeaderboardId == currentBoard.Id && x.WeekStartsAtUtc == weekStart,
                cancellationToken);
        }
    }

    public static async Task<LeaderboardSeasonParticipant> EnsureParticipantAsync(
        IAppDbContext db,
        LeaderboardSeason season,
        string userId,
        DateTime joinedAtUtc,
        DateTime nowUtc,
        CancellationToken cancellationToken)
    {
        var participant = await db.LeaderboardSeasonParticipants.FirstOrDefaultAsync(x =>
                !x.IsDeleted && x.SeasonId == season.Id && x.UserId == userId,
            cancellationToken);
        if (participant is null)
        {
            participant = new LeaderboardSeasonParticipant
            {
                Id = Guid.NewGuid().ToString("N"),
                SeasonId = season.Id,
                UserId = userId,
                JoinedAtUtc = ClampJoinTime(joinedAtUtc, season, nowUtc),
                RewardStatus = LeaderboardRewardStatuses.Open
            };
            db.LeaderboardSeasonParticipants.Add(participant);
        }
        else if (participant.OptedOutAtUtc is not null)
        {
            participant.JoinedAtUtc = ClampJoinTime(nowUtc, season, nowUtc);
            participant.OptedOutAtUtc = null;
            participant.FinalScore = 0;
            participant.FinalRank = null;
            participant.ActiveDays = 0;
            participant.RewardCredits = 0;
            participant.RewardExpiresAtUtc = null;
            participant.RewardStatus = LeaderboardRewardStatuses.Open;
            participant.RewardedAtUtc = null;
            participant.RewardLastAttemptAtUtc = null;
            participant.RewardAttempts = 0;
            participant.RewardFailureCode = null;
        }

        return participant;
    }

    public static LeaderboardBoardDefinitionDto ReadBoard(LeaderboardSeason season)
    {
        try
        {
            var board = JsonSerializer.Deserialize<LeaderboardBoardDefinitionDto>(season.ConfigJson, JsonOptions);
            if (board is not null && LeaderboardCatalogSerializer.TryNormalize(
                    new LeaderboardCatalogConfigDto { Boards = [board] }, out var normalized, out _))
                return normalized.Boards.Single();
        }
        catch (JsonException)
        {
            // A malformed frozen snapshot is handled as a default board below;
            // the original value remains available for operational diagnosis.
        }

        return LeaderboardCatalogSerializer.GetDefault().Boards.Single();
    }

    public static DateTime GetWeekStart(DateTime utcDate)
    {
        var date = DateTime.SpecifyKind(utcDate.Date, DateTimeKind.Utc);
        return date.AddDays(-(((int)date.DayOfWeek + 6) % 7));
    }

    private static DateTime ClampJoinTime(DateTime joinedAtUtc, LeaderboardSeason season, DateTime nowUtc) =>
        joinedAtUtc < season.WeekStartsAtUtc
            ? season.WeekStartsAtUtc
            : joinedAtUtc > nowUtc ? nowUtc : joinedAtUtc;
}
