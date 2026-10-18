namespace MemoPal.Domain.Education;

public static class EducationMasteryStatuses
{
    public const string InsufficientEvidence = "insufficient-evidence";
    public const string NeedsRevalidation = "needs-revalidation";
    public const string SelectedResponseOnly = "selected-response-only";
    public const string CurrentlyStrong = "currently-strong";
    public const string ContinuePractice = "continue-practice";
    public const string NeedsSupport = "needs-support";
}

public sealed record EducationMasteryEvidenceSummary(
    decimal Score,
    decimal MaxScore,
    int DistinctQuestionCount,
    int DistinctAssessmentCount,
    int DistinctSubmissionDateCount);

public static class EducationMasteryCalculator
{
    public const int MinimumDistinctQuestions = 5;
    public const int MinimumAssessments = 2;
    public const int MinimumSubmissionDates = 2;

    public static string GetStatus(EducationMasteryEvidenceSummary evidence)
    {
        ArgumentNullException.ThrowIfNull(evidence);
        if (evidence.MaxScore <= 0 || evidence.Score < 0 || evidence.Score > evidence.MaxScore)
            throw new ArgumentOutOfRangeException(nameof(evidence), "Evidence score must be between zero and a positive maximum score.");
        if (evidence.DistinctQuestionCount < 0 || evidence.DistinctAssessmentCount < 0 || evidence.DistinctSubmissionDateCount < 0)
            throw new ArgumentOutOfRangeException(nameof(evidence), "Evidence counts cannot be negative.");

        if (evidence.DistinctQuestionCount < MinimumDistinctQuestions ||
            evidence.DistinctAssessmentCount < MinimumAssessments ||
            evidence.DistinctSubmissionDateCount < MinimumSubmissionDates)
            return EducationMasteryStatuses.InsufficientEvidence;

        var percentage = evidence.Score / evidence.MaxScore;
        if (percentage >= 0.8m) return EducationMasteryStatuses.CurrentlyStrong;
        if (percentage >= 0.6m) return EducationMasteryStatuses.ContinuePractice;
        return EducationMasteryStatuses.NeedsSupport;
    }
}
