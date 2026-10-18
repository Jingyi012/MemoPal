using System.Collections.ObjectModel;

namespace MemoPal.Domain.Education;

public sealed record ObjectiveQuestionOption
{
    public ObjectiveQuestionOption(string id, string text)
    {
        if (string.IsNullOrWhiteSpace(id))
            throw new ArgumentException("Option ID is required.", nameof(id));
        if (string.IsNullOrWhiteSpace(text))
            throw new ArgumentException("Option text is required.", nameof(text));

        Id = id;
        Text = text;
    }

    public string Id { get; }
    public string Text { get; }
}

public sealed class ObjectiveQuestionDefinition
{
    private ObjectiveQuestionDefinition(
        string questionType,
        decimal maxScore,
        IReadOnlyList<ObjectiveQuestionOption>? options = null,
        string? correctOptionId = null,
        IReadOnlyList<string>? correctOptionIds = null,
        IReadOnlyList<string>? correctSequenceIds = null,
        IReadOnlyList<ObjectiveQuestionOption>? matchTargets = null,
        IReadOnlyList<ObjectiveQuestionMatch>? correctMatches = null,
        bool? correctBooleanAnswer = null,
        string? fillBlankMode = null,
        IReadOnlyList<string>? allowedTextAnswers = null,
        bool trimTextAnswers = false,
        TextAnswerCasePolicy? textCasePolicy = null,
        IReadOnlyList<decimal>? allowedNumericAnswers = null,
        decimal numericTolerance = 0)
    {
        if (maxScore <= 0)
            throw new ArgumentException("Maximum score must be positive.", nameof(maxScore));
        if (textCasePolicy is not null && !Enum.IsDefined(textCasePolicy.Value))
            throw new ArgumentException("Unsupported text answer case policy.", nameof(textCasePolicy));

        QuestionType = questionType;
        MaxScore = maxScore;
        Options = Freeze(options);
        CorrectOptionId = correctOptionId;
        CorrectOptionIds = Freeze(correctOptionIds);
        CorrectSequenceIds = Freeze(correctSequenceIds);
        MatchTargets = Freeze(matchTargets);
        CorrectMatches = Freeze(correctMatches);
        CorrectBooleanAnswer = correctBooleanAnswer;
        FillBlankMode = fillBlankMode;
        AllowedTextAnswers = Freeze(allowedTextAnswers);
        TrimTextAnswers = trimTextAnswers;
        TextCasePolicy = textCasePolicy;
        AllowedNumericAnswers = Freeze(allowedNumericAnswers);
        NumericTolerance = numericTolerance;
        Validate();
    }

    public string QuestionType { get; }
    public decimal MaxScore { get; }
    public IReadOnlyList<ObjectiveQuestionOption> Options { get; }
    public string? CorrectOptionId { get; }
    public IReadOnlyList<string> CorrectOptionIds { get; }
    public IReadOnlyList<string> CorrectSequenceIds { get; }
    public IReadOnlyList<ObjectiveQuestionOption> MatchTargets { get; }
    public IReadOnlyList<ObjectiveQuestionMatch> CorrectMatches { get; }
    public bool? CorrectBooleanAnswer { get; }
    public string? FillBlankMode { get; }
    public IReadOnlyList<string> AllowedTextAnswers { get; }
    public bool TrimTextAnswers { get; }
    public TextAnswerCasePolicy? TextCasePolicy { get; }
    public IReadOnlyList<decimal> AllowedNumericAnswers { get; }
    public decimal NumericTolerance { get; }

    public static ObjectiveQuestionDefinition SingleChoice(
        decimal maxScore,
        IEnumerable<ObjectiveQuestionOption> options,
        string correctOptionId)
    {
        var optionSnapshot = Snapshot(options, nameof(options));
        if (optionSnapshot.Any(option => option is null))
            throw new ArgumentException("Options cannot contain null entries.", nameof(options));

        return new(ObjectiveQuestionTypeCodes.SingleChoice, maxScore,
            options: optionSnapshot, correctOptionId: correctOptionId);
    }

    public static ObjectiveQuestionDefinition MultipleSelect(
        decimal maxScore,
        IEnumerable<ObjectiveQuestionOption> options,
        IEnumerable<string> correctOptionIds)
    {
        var optionSnapshot = Snapshot(options, nameof(options));
        if (optionSnapshot.Any(option => option is null))
            throw new ArgumentException("Options cannot contain null entries.", nameof(options));
        return new(ObjectiveQuestionTypeCodes.MultipleSelect, maxScore,
            options: optionSnapshot, correctOptionIds: Snapshot(correctOptionIds, nameof(correctOptionIds)));
    }

    public static ObjectiveQuestionDefinition Ordering(
        decimal maxScore,
        IEnumerable<ObjectiveQuestionOption> options,
        IEnumerable<string> correctSequenceIds)
    {
        var optionSnapshot = Snapshot(options, nameof(options));
        if (optionSnapshot.Any(option => option is null))
            throw new ArgumentException("Options cannot contain null entries.", nameof(options));
        return new(ObjectiveQuestionTypeCodes.Ordering, maxScore, options: optionSnapshot,
            correctSequenceIds: Snapshot(correctSequenceIds, nameof(correctSequenceIds)));
    }

    public static ObjectiveQuestionDefinition Matching(
        decimal maxScore,
        IEnumerable<ObjectiveQuestionOption> options,
        IEnumerable<ObjectiveQuestionOption> matchTargets,
        IEnumerable<ObjectiveQuestionMatch> correctMatches)
    {
        var optionSnapshot = Snapshot(options, nameof(options));
        var targetSnapshot = Snapshot(matchTargets, nameof(matchTargets));
        var matchSnapshot = Snapshot(correctMatches, nameof(correctMatches));
        if (optionSnapshot.Any(option => option is null) || targetSnapshot.Any(target => target is null) || matchSnapshot.Any(match => match is null))
            throw new ArgumentException("Matching options and pairs cannot contain null entries.");
        return new(ObjectiveQuestionTypeCodes.Matching, maxScore, options: optionSnapshot,
            matchTargets: targetSnapshot, correctMatches: matchSnapshot);
    }

    public static ObjectiveQuestionDefinition TrueFalse(decimal maxScore, bool correctAnswer) =>
        new(ObjectiveQuestionTypeCodes.TrueFalse, maxScore, correctBooleanAnswer: correctAnswer);

    public static ObjectiveQuestionDefinition TextFillBlank(
        decimal maxScore,
        IEnumerable<string> allowedAnswers,
        bool trimAnswers,
        TextAnswerCasePolicy casePolicy) =>
        new(ObjectiveQuestionTypeCodes.FillBlank, maxScore,
            fillBlankMode: FillBlankModeCodes.Text,
            allowedTextAnswers: Snapshot(allowedAnswers, nameof(allowedAnswers)),
            trimTextAnswers: trimAnswers,
            textCasePolicy: casePolicy);

    public static ObjectiveQuestionDefinition NumericFillBlank(
        decimal maxScore,
        IEnumerable<decimal> allowedAnswers,
        decimal tolerance = 0) =>
        new(ObjectiveQuestionTypeCodes.FillBlank, maxScore,
            fillBlankMode: FillBlankModeCodes.Number,
            allowedNumericAnswers: Snapshot(allowedAnswers, nameof(allowedAnswers)),
            numericTolerance: tolerance);

    private void Validate()
    {
        switch (QuestionType)
        {
            case ObjectiveQuestionTypeCodes.SingleChoice:
                if (Options.Count < 2 || Options.Select(option => option.Id).Distinct(StringComparer.Ordinal).Count() != Options.Count)
                    throw new ArgumentException("Single-choice questions require at least two options with unique IDs.");
                if (string.IsNullOrWhiteSpace(CorrectOptionId) || !Options.Any(option => option.Id == CorrectOptionId))
                    throw new ArgumentException("The correct option ID must identify one of the question's options.");
                break;
            case ObjectiveQuestionTypeCodes.MultipleSelect:
                if (Options.Count < 2 || Options.Select(option => option.Id).Distinct(StringComparer.Ordinal).Count() != Options.Count)
                    throw new ArgumentException("Multiple-select questions require at least two options with unique IDs.");
                if (CorrectOptionIds.Count < 2 || CorrectOptionIds.Distinct(StringComparer.Ordinal).Count() != CorrectOptionIds.Count ||
                    CorrectOptionIds.Any(id => !Options.Any(option => option.Id == id)))
                    throw new ArgumentException("Multiple-select questions require at least two distinct correct option IDs from the question.");
                break;
            case ObjectiveQuestionTypeCodes.Ordering:
                if (Options.Count is < 2 or > 10 || Options.Select(option => option.Id).Distinct(StringComparer.Ordinal).Count() != Options.Count)
                    throw new ArgumentException("Ordering questions require 2 to 10 options with unique IDs.");
                if (CorrectSequenceIds.Count != Options.Count ||
                    CorrectSequenceIds.Distinct(StringComparer.Ordinal).Count() != CorrectSequenceIds.Count ||
                    CorrectSequenceIds.Any(id => !Options.Any(option => option.Id == id)))
                    throw new ArgumentException("The correct order must contain every question option exactly once.");
                if (Options.Select(option => option.Id).SequenceEqual(CorrectSequenceIds, StringComparer.Ordinal))
                    throw new ArgumentException("The displayed starting order must differ from the correct order.");
                break;
            case ObjectiveQuestionTypeCodes.Matching:
                if (Options.Count is < 2 or > 10 || MatchTargets.Count != Options.Count ||
                    MatchTargets.Count is < 2 or > 10 ||
                    Options.Select(option => option.Id).Distinct(StringComparer.Ordinal).Count() != Options.Count ||
                    MatchTargets.Select(target => target.Id).Distinct(StringComparer.Ordinal).Count() != MatchTargets.Count)
                    throw new ArgumentException("Matching questions require 2 to 10 unique items on each side.");
                if (CorrectMatches.Count != Options.Count ||
                    CorrectMatches.Select(match => match.LeftOptionId).Distinct(StringComparer.Ordinal).Count() != Options.Count ||
                    CorrectMatches.Select(match => match.MatchTargetId).Distinct(StringComparer.Ordinal).Count() != MatchTargets.Count ||
                    CorrectMatches.Any(match => !Options.Any(option => option.Id == match.LeftOptionId) ||
                        !MatchTargets.Any(target => target.Id == match.MatchTargetId)))
                    throw new ArgumentException("Each matching item must have exactly one correct pair.");
                break;
            case ObjectiveQuestionTypeCodes.TrueFalse:
                if (CorrectBooleanAnswer is null)
                    throw new ArgumentException("A true-false question requires exactly one correct boolean answer.");
                break;
            case ObjectiveQuestionTypeCodes.FillBlank:
                if (FillBlankMode == FillBlankModeCodes.Text)
                {
                    if (AllowedTextAnswers.Count == 0 || AllowedTextAnswers.Any(string.IsNullOrWhiteSpace) || TextCasePolicy is null)
                        throw new ArgumentException("Text fill-blank questions require non-empty allowed answers and an explicit case policy.");
                }
                else if (FillBlankMode == FillBlankModeCodes.Number)
                {
                    if (AllowedNumericAnswers.Count == 0 || NumericTolerance < 0)
                        throw new ArgumentException("Numeric fill-blank questions require allowed numbers and a non-negative tolerance.");
                }
                else
                    throw new ArgumentException("Unsupported fill-blank mode.");
                break;
            default:
                throw new ArgumentException("Unsupported objective question type.");
        }
    }

    private static IReadOnlyList<T> Freeze<T>(IReadOnlyList<T>? values) =>
        new ReadOnlyCollection<T>(values?.ToArray() ?? []);

    private static IReadOnlyList<T> Snapshot<T>(IEnumerable<T> values, string parameterName)
    {
        ArgumentNullException.ThrowIfNull(values, parameterName);
        return values.ToArray();
    }
}
