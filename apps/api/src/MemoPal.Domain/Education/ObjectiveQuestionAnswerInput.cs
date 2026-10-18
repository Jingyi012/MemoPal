namespace MemoPal.Domain.Education;

public sealed record ObjectiveQuestionAnswerInput
{
    private ObjectiveQuestionAnswerInput(string? selectedOptionId, IReadOnlyList<string>? selectedOptionIds,
        IReadOnlyList<string>? orderedOptionIds, IReadOnlyList<ObjectiveQuestionMatch>? matches,
        bool? booleanAnswer, string? textAnswer, string? numericAnswer)
    {
        SelectedOptionId = selectedOptionId;
        SelectedOptionIds = selectedOptionIds;
        OrderedOptionIds = orderedOptionIds;
        Matches = matches;
        BooleanAnswer = booleanAnswer;
        TextAnswer = textAnswer;
        NumericAnswer = numericAnswer;
    }

    public string? SelectedOptionId { get; }
    public IReadOnlyList<string>? SelectedOptionIds { get; }
    public IReadOnlyList<string>? OrderedOptionIds { get; }
    public IReadOnlyList<ObjectiveQuestionMatch>? Matches { get; }
    public bool? BooleanAnswer { get; }
    public string? TextAnswer { get; }
    public string? NumericAnswer { get; }

    public static ObjectiveQuestionAnswerInput SingleChoice(string optionId) =>
        new(optionId ?? throw new ArgumentNullException(nameof(optionId)), null, null, null, null, null, null);

    public static ObjectiveQuestionAnswerInput MultipleSelect(IEnumerable<string> optionIds) =>
        new(null, (optionIds ?? throw new ArgumentNullException(nameof(optionIds))).ToArray(), null, null, null, null, null);

    public static ObjectiveQuestionAnswerInput Ordering(IEnumerable<string> orderedOptionIds) =>
        new(null, null, (orderedOptionIds ?? throw new ArgumentNullException(nameof(orderedOptionIds))).ToArray(), null, null, null, null);

    public static ObjectiveQuestionAnswerInput Matching(IEnumerable<ObjectiveQuestionMatch> matches) =>
        new(null, null, null, (matches ?? throw new ArgumentNullException(nameof(matches))).ToArray(), null, null, null);

    public static ObjectiveQuestionAnswerInput TrueFalse(bool answer) => new(null, null, null, null, answer, null, null);
    public static ObjectiveQuestionAnswerInput Text(string answer) => new(null, null, null, null, null, answer ?? throw new ArgumentNullException(nameof(answer)), null);
    public static ObjectiveQuestionAnswerInput Number(string answer) => new(null, null, null, null, null, null, answer ?? throw new ArgumentNullException(nameof(answer)));
}
