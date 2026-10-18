using MemoPal.Application.Features.Leaderboards.DTOs;

namespace MemoPal.Application.Features.Leaderboards;

public sealed record LeaderboardRewardStanding(string UserId, int Score, int ActiveDays);

public static class LeaderboardRewardCalculator
{
    public static IReadOnlyDictionary<string, int> CalculateCredits(
        IReadOnlyCollection<LeaderboardRewardStanding> standings,
        LeaderboardRewardConfigDto config)
    {
        var awards = standings.ToDictionary(x => x.UserId, _ => 0, StringComparer.Ordinal);
        if (!config.Enabled || standings.Count == 0) return awards;

        var ordered = standings.OrderByDescending(x => x.Score)
            .ThenBy(x => x.UserId, StringComparer.Ordinal)
            .ToArray();

        for (var index = 0; index < ordered.Length;)
        {
            var end = index + 1;
            while (end < ordered.Length && ordered[end].Score == ordered[index].Score) end++;

            var rank = index + 1;
            var tiedCount = end - index;
            if (rank <= 100)
            {
                var tiedPrizePool = 0L;
                for (var occupiedRank = rank; occupiedRank < rank + tiedCount && occupiedRank <= 100; occupiedRank++)
                {
                    tiedPrizePool += config.Tiers
                        .FirstOrDefault(x => occupiedRank >= x.RankFrom && occupiedRank <= x.RankTo)
                        ?.CreditsPerWinner ?? 0;
                }

                var perPlayer = (int)(tiedPrizePool / tiedCount);
                for (var tiedIndex = index; tiedIndex < end; tiedIndex++)
                {
                    if (ordered[tiedIndex].ActiveDays >= config.MinimumActiveDays)
                        awards[ordered[tiedIndex].UserId] = perPlayer;
                }
            }

            index = end;
        }

        return awards;
    }
}
