using MemoPal.Domain.Education;

namespace MemoPal.UnitTests;

public sealed class EducationLeaderboardCalculatorTests
{
    [Theory]
    [InlineData(90, 1)]
    [InlineData(85, 2)]
    [InlineData(80, 4)]
    public void Uses_competition_ranks_for_tied_scores(decimal score, int expectedRank)
    {
        Assert.Equal(expectedRank,
            EducationLeaderboardCalculator.GetCompetitionRank([90, 85, 85, 80], score));
    }
}
