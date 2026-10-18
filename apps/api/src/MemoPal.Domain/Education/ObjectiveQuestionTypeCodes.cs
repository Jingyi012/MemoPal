namespace MemoPal.Domain.Education;

public static class ObjectiveQuestionTypeCodes
{
    public const string SingleChoice = "single-choice";
    public const string MultipleSelect = "multiple-select";
    public const string Ordering = "ordering";
    public const string Matching = "matching";
    public const string TrueFalse = "true-false";
    public const string FillBlank = "fill-blank";
    public const string WrittenResponse = "written-response";
    public const string PhotoResponse = "photo-response";
    public const string VoiceResponse = "voice-response";
}

public static class FillBlankModeCodes
{
    public const string Text = "text";
    public const string Number = "number";
}

public enum TextAnswerCasePolicy
{
    Sensitive,
    Insensitive
}
