namespace MemoPal.Domain.Education;

public static class EducationLeaderboardCalculator
{
    public static int GetCompetitionRank(IEnumerable<decimal> publishedScores, decimal score) =>
        publishedScores.Count(candidate => candidate > score) + 1;
}
