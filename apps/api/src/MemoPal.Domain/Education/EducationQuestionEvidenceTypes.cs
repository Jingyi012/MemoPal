namespace MemoPal.Domain.Education;

public static class EducationQuestionEvidenceTypes
{
    public const string SelectedResponse = "selected-response";
    public const string OpenResponse = "open-response";

    public static string FromQuestionType(string questionType) => questionType switch
    {
        ObjectiveQuestionTypeCodes.SingleChoice or
        ObjectiveQuestionTypeCodes.MultipleSelect or
        ObjectiveQuestionTypeCodes.Ordering or
        ObjectiveQuestionTypeCodes.Matching or
        ObjectiveQuestionTypeCodes.TrueFalse => SelectedResponse,
        ObjectiveQuestionTypeCodes.FillBlank or
        ObjectiveQuestionTypeCodes.WrittenResponse or
        ObjectiveQuestionTypeCodes.PhotoResponse or
        ObjectiveQuestionTypeCodes.VoiceResponse => OpenResponse,
        _ => throw new ArgumentOutOfRangeException(nameof(questionType), questionType, "Unsupported education question type.")
    };
}
