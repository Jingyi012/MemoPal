using MemoPal.Domain.Education;

namespace MemoPal.Application.Features.Education.Attempts;

public static class EducationPracticeQuestionTypes
{
    private static readonly HashSet<string> Supported =
    [
        ObjectiveQuestionTypeCodes.SingleChoice,
        ObjectiveQuestionTypeCodes.MultipleSelect,
        ObjectiveQuestionTypeCodes.Ordering,
        ObjectiveQuestionTypeCodes.Matching,
        ObjectiveQuestionTypeCodes.TrueFalse,
        ObjectiveQuestionTypeCodes.FillBlank
    ];

    public static bool IsSupported(string questionType) => Supported.Contains(questionType);
}
