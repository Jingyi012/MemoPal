using System.Globalization;

namespace MemoPal.Domain.Education;

public sealed record ObjectiveQuestionGrade(decimal Score, decimal MaxScore, bool IsCorrect);

public static class ObjectiveQuestionScorer
{
    public static ObjectiveQuestionGrade Grade(
        ObjectiveQuestionDefinition question,
        ObjectiveQuestionAnswerInput answer)
    {
        ArgumentNullException.ThrowIfNull(question);
        ArgumentNullException.ThrowIfNull(answer);

        if (question.QuestionType == ObjectiveQuestionTypeCodes.Matching)
            return GradeMatching(question, answer);

        bool isCorrect = question.QuestionType switch
        {
            ObjectiveQuestionTypeCodes.SingleChoice => GradeSingleChoice(question, answer),
            ObjectiveQuestionTypeCodes.MultipleSelect => GradeMultipleSelect(question, answer),
            ObjectiveQuestionTypeCodes.Ordering => GradeOrdering(question, answer),
            ObjectiveQuestionTypeCodes.TrueFalse => GradeTrueFalse(question, answer),
            ObjectiveQuestionTypeCodes.FillBlank when question.FillBlankMode == FillBlankModeCodes.Text => GradeText(question, answer),
            ObjectiveQuestionTypeCodes.FillBlank when question.FillBlankMode == FillBlankModeCodes.Number => GradeNumber(question, answer),
            _ => throw new ArgumentException("Unsupported objective question definition.", nameof(question))
        };

        return new ObjectiveQuestionGrade(isCorrect ? question.MaxScore : 0, question.MaxScore, isCorrect);
    }

    private static bool GradeSingleChoice(ObjectiveQuestionDefinition question, ObjectiveQuestionAnswerInput answer)
    {
        RequireOnly(answer, nameof(answer.SelectedOptionId), answer.SelectedOptionId, answer.SelectedOptionIds,
            answer.OrderedOptionIds, answer.Matches, answer.BooleanAnswer, answer.TextAnswer, answer.NumericAnswer);
        if (answer.SelectedOptionId is null || !question.Options.Any(option => option.Id == answer.SelectedOptionId))
            throw new ArgumentException("Selected option ID does not belong to the question.", nameof(answer));
        return answer.SelectedOptionId == question.CorrectOptionId;
    }

    private static bool GradeMultipleSelect(ObjectiveQuestionDefinition question, ObjectiveQuestionAnswerInput answer)
    {
        RequireOnly(answer, nameof(answer.SelectedOptionIds), answer.SelectedOptionIds, answer.OrderedOptionIds, answer.Matches, answer.SelectedOptionId, answer.BooleanAnswer, answer.TextAnswer, answer.NumericAnswer);
        var selected = answer.SelectedOptionIds!;
        if (selected.Count == 0 || selected.Distinct(StringComparer.Ordinal).Count() != selected.Count ||
            selected.Any(id => !question.Options.Any(option => option.Id == id)))
            throw new ArgumentException("Selected option IDs must be non-empty, unique, and belong to the question.", nameof(answer));
        return selected.Count == question.CorrectOptionIds.Count &&
            selected.All(id => question.CorrectOptionIds.Contains(id, StringComparer.Ordinal));
    }

    private static bool GradeOrdering(ObjectiveQuestionDefinition question, ObjectiveQuestionAnswerInput answer)
    {
        RequireOnly(answer, nameof(answer.OrderedOptionIds), answer.OrderedOptionIds, answer.SelectedOptionId,
            answer.SelectedOptionIds, answer.Matches, answer.BooleanAnswer, answer.TextAnswer, answer.NumericAnswer);
        var submitted = answer.OrderedOptionIds!;
        if (submitted.Count != question.Options.Count || submitted.Distinct(StringComparer.Ordinal).Count() != submitted.Count ||
            submitted.Any(id => !question.Options.Any(option => option.Id == id)))
            throw new ArgumentException("The submitted order must contain every question option exactly once.", nameof(answer));
        return submitted.SequenceEqual(question.CorrectSequenceIds, StringComparer.Ordinal);
    }

    private static ObjectiveQuestionGrade GradeMatching(ObjectiveQuestionDefinition question, ObjectiveQuestionAnswerInput answer)
    {
        RequireOnly(answer, nameof(answer.Matches), answer.Matches, answer.SelectedOptionId,
            answer.SelectedOptionIds, answer.OrderedOptionIds, answer.BooleanAnswer, answer.TextAnswer, answer.NumericAnswer);
        var submitted = answer.Matches!;
        if (submitted.Count > question.Options.Count ||
            submitted.Select(match => match.LeftOptionId).Distinct(StringComparer.Ordinal).Count() != submitted.Count ||
            submitted.Select(match => match.MatchTargetId).Distinct(StringComparer.Ordinal).Count() != submitted.Count ||
            submitted.Any(match => !question.Options.Any(option => option.Id == match.LeftOptionId) ||
                !question.MatchTargets.Any(target => target.Id == match.MatchTargetId)))
            throw new ArgumentException("Matching answers must use each owned item at most once.", nameof(answer));

        var correctCount = submitted.Count(match => question.CorrectMatches.Any(correct =>
            correct.LeftOptionId == match.LeftOptionId && correct.MatchTargetId == match.MatchTargetId));
        var isCorrect = submitted.Count == question.Options.Count && correctCount == question.Options.Count;
        var score = isCorrect ? question.MaxScore : question.MaxScore * correctCount / question.Options.Count;
        return new ObjectiveQuestionGrade(score, question.MaxScore, isCorrect);
    }

    private static bool GradeTrueFalse(ObjectiveQuestionDefinition question, ObjectiveQuestionAnswerInput answer)
    {
        RequireOnly(answer, nameof(answer.BooleanAnswer), answer.BooleanAnswer, answer.SelectedOptionId, answer.SelectedOptionIds, answer.OrderedOptionIds, answer.Matches, answer.TextAnswer, answer.NumericAnswer);
        if (answer.BooleanAnswer is null)
            throw new ArgumentException("A true-false answer is required.", nameof(answer));
        return answer.BooleanAnswer == question.CorrectBooleanAnswer;
    }

    private static bool GradeText(ObjectiveQuestionDefinition question, ObjectiveQuestionAnswerInput answer)
    {
        RequireOnly(answer, nameof(answer.TextAnswer), answer.TextAnswer, answer.SelectedOptionId, answer.SelectedOptionIds, answer.OrderedOptionIds, answer.Matches, answer.BooleanAnswer, answer.NumericAnswer);
        if (answer.TextAnswer is null)
            throw new ArgumentException("A text answer is required.", nameof(answer));

        var comparison = question.TextCasePolicy switch
        {
            TextAnswerCasePolicy.Sensitive => StringComparison.Ordinal,
            TextAnswerCasePolicy.Insensitive => StringComparison.OrdinalIgnoreCase,
            _ => throw new ArgumentException("Unsupported text answer case policy.", nameof(question))
        };
        var submitted = question.TrimTextAnswers ? answer.TextAnswer.Trim() : answer.TextAnswer;
        return question.AllowedTextAnswers.Any(allowed => string.Equals(
            submitted,
            question.TrimTextAnswers ? allowed.Trim() : allowed,
            comparison));
    }

    private static bool GradeNumber(ObjectiveQuestionDefinition question, ObjectiveQuestionAnswerInput answer)
    {
        RequireOnly(answer, nameof(answer.NumericAnswer), answer.NumericAnswer, answer.SelectedOptionId, answer.SelectedOptionIds, answer.OrderedOptionIds, answer.Matches, answer.BooleanAnswer, answer.TextAnswer);
        const NumberStyles numericStyles = NumberStyles.AllowLeadingWhite
            | NumberStyles.AllowTrailingWhite
            | NumberStyles.AllowLeadingSign
            | NumberStyles.AllowDecimalPoint;
        if (answer.NumericAnswer is null || !decimal.TryParse(answer.NumericAnswer, numericStyles, CultureInfo.InvariantCulture, out var submitted))
            throw new ArgumentException("Numeric answer must be a valid invariant-culture decimal.", nameof(answer));
        return question.AllowedNumericAnswers.Any(allowed => IsWithinTolerance(submitted, allowed, question.NumericTolerance));
    }

    private static bool IsWithinTolerance(decimal submitted, decimal allowed, decimal tolerance)
    {
        var lowerBound = allowed < decimal.MinValue + tolerance
            ? decimal.MinValue
            : allowed - tolerance;
        var upperBound = allowed > decimal.MaxValue - tolerance
            ? decimal.MaxValue
            : allowed + tolerance;

        return submitted >= lowerBound && submitted <= upperBound;
    }

    private static void RequireOnly(ObjectiveQuestionAnswerInput answer, string expected, object? supplied, params object?[] others)
    {
        if (supplied is null || others.Any(value => value is not null))
            throw new ArgumentException($"Answer must provide only {expected}.", nameof(answer));
    }
}
