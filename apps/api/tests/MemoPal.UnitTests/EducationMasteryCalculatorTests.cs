using MemoPal.Domain.Education;

namespace MemoPal.UnitTests;

public sealed class EducationMasteryCalculatorTests
{
    [Fact]
    public void RequiresIndependentEvidenceAcrossQuestionsAssessmentsAndDates()
    {
        Assert.Equal(EducationMasteryStatuses.InsufficientEvidence,
            EducationMasteryCalculator.GetStatus(new(5, 5, 5, 1, 2)));
        Assert.Equal(EducationMasteryStatuses.InsufficientEvidence,
            EducationMasteryCalculator.GetStatus(new(5, 5, 5, 2, 1)));
        Assert.Equal(EducationMasteryStatuses.InsufficientEvidence,
            EducationMasteryCalculator.GetStatus(new(5, 5, 4, 2, 2)));
    }

    [Theory]
    [InlineData(4, EducationMasteryStatuses.CurrentlyStrong)]
    [InlineData(3, EducationMasteryStatuses.ContinuePractice)]
    [InlineData(2, EducationMasteryStatuses.NeedsSupport)]
    public void UsesDeclaredScoreBandsOnlyAfterEvidenceThreshold(decimal score, string expected)
    {
        Assert.Equal(expected,
            EducationMasteryCalculator.GetStatus(new(score, 5, 5, 2, 2)));
    }

    [Fact]
    public void RejectsInvalidEvidenceTotals()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            EducationMasteryCalculator.GetStatus(new(6, 5, 5, 2, 2)));
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            EducationMasteryCalculator.GetStatus(new(1, 0, 5, 2, 2)));
    }
}
