using MemoPal.Application.Features.Leaderboards.DTOs;

namespace MemoPal.Application.Features.Leaderboards;

public static class LeaderboardScoringCalculator
{
    public static int CalculateDailyScore(
        int distinctRecallItems,
        int distinctDueReviewItems,
        IReadOnlyList<LeaderboardScoringTaskDto> tasks) => tasks.Sum(task =>
    {
        var currentValue = task.Metric == LeaderboardTaskMetrics.DistinctRecallItems
            ? distinctRecallItems
            : distinctDueReviewItems;
        return currentValue >= task.Threshold ? task.Points : 0;
    });
}
