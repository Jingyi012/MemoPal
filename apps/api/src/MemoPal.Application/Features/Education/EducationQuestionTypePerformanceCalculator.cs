using MemoPal.Application.Features.Education.DTOs;
using MemoPal.Domain.Education;

namespace MemoPal.Application.Features.Education;

public sealed record EducationResponseTypePerformance(
    EducationQuestionTypePerformanceDto SelectedResponse,
    EducationQuestionTypePerformanceDto OpenResponse);

public static class EducationQuestionTypePerformanceCalculator
{
    public static EducationResponseTypePerformance Calculate(IEnumerable<EducationScoredQuestionEvidence> evidence)
    {
        ArgumentNullException.ThrowIfNull(evidence);
        var uniqueEvidence = evidence
            .GroupBy(x => new { x.AssessmentId, x.QuestionId })
            .Select(group => group.OrderBy(x => x.SubmittedAt).First())
            .ToArray();
        var selected = uniqueEvidence.Where(x =>
            EducationQuestionEvidenceTypes.FromQuestionType(x.QuestionType) == EducationQuestionEvidenceTypes.SelectedResponse).ToArray();
        var open = uniqueEvidence.Where(x =>
            EducationQuestionEvidenceTypes.FromQuestionType(x.QuestionType) == EducationQuestionEvidenceTypes.OpenResponse).ToArray();
        return new(Summarize(selected), Summarize(open));
    }

    private static EducationQuestionTypePerformanceDto Summarize(IReadOnlyList<EducationScoredQuestionEvidence> evidence)
    {
        if (evidence.Count == 0) return new(null, null, null, 0, 0, 0);
        var score = evidence.Sum(x => x.Score);
        var maxScore = evidence.Sum(x => x.MaxScore);
        return new(
            score,
            maxScore,
            maxScore > 0 ? decimal.Round(score / maxScore * 100m, 1) : null,
            evidence.Select(x => x.QuestionId).Distinct(StringComparer.Ordinal).Count(),
            evidence.Select(x => x.AssessmentId).Distinct(StringComparer.Ordinal).Count(),
            evidence.Select(x => DateOnly.FromDateTime(x.SubmittedAt)).Distinct().Count());
    }
}
