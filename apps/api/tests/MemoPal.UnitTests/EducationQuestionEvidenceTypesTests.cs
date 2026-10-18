using MemoPal.Domain.Education;

namespace MemoPal.UnitTests;

public sealed class EducationQuestionEvidenceTypesTests
{
    [Theory]
    [InlineData(ObjectiveQuestionTypeCodes.SingleChoice, EducationQuestionEvidenceTypes.SelectedResponse)]
    [InlineData(ObjectiveQuestionTypeCodes.MultipleSelect, EducationQuestionEvidenceTypes.SelectedResponse)]
    [InlineData(ObjectiveQuestionTypeCodes.Ordering, EducationQuestionEvidenceTypes.SelectedResponse)]
    [InlineData(ObjectiveQuestionTypeCodes.Matching, EducationQuestionEvidenceTypes.SelectedResponse)]
    [InlineData(ObjectiveQuestionTypeCodes.TrueFalse, EducationQuestionEvidenceTypes.SelectedResponse)]
    [InlineData(ObjectiveQuestionTypeCodes.FillBlank, EducationQuestionEvidenceTypes.OpenResponse)]
    [InlineData(ObjectiveQuestionTypeCodes.WrittenResponse, EducationQuestionEvidenceTypes.OpenResponse)]
    [InlineData(ObjectiveQuestionTypeCodes.PhotoResponse, EducationQuestionEvidenceTypes.OpenResponse)]
    [InlineData(ObjectiveQuestionTypeCodes.VoiceResponse, EducationQuestionEvidenceTypes.OpenResponse)]
    public void Classifies_evidence_by_whether_the_response_is_selected_or_constructed(string questionType, string expected)
    {
        Assert.Equal(expected, EducationQuestionEvidenceTypes.FromQuestionType(questionType));
    }

    [Fact]
    public void Rejects_unknown_question_types_instead_of_silently_misclassifying_them()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => EducationQuestionEvidenceTypes.FromQuestionType("future-type"));
    }
}
