using System.Text.Json;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Features.Education.Authoring;
using MemoPal.Application.Features.Education.Authoring.DTOs;

namespace MemoPal.UnitTests;

public sealed class EducationWordBankTests
{
    private static EducationQuestionRequest TextQuestion => new(null, "A seed grows a ___.", "fill-blank", "text", 1, "objective",
        Options: [new("a", " ROOT "), new("b", "flower")], AllowedTextAnswers: ["root"], TrimTextAnswers: true, IgnoreCase: true);

    [Fact]
    public void Word_bank_round_trips_in_existing_options_storage_and_uses_text_grading_rules()
    {
        var question = EducationQuestionSeedFactory.Create(TextQuestion, "assessment", 1);
        Assert.Equal(2, JsonSerializer.Deserialize<EducationOptionRequest[]>(question.OptionsJson)!.Length);
        Assert.Equal("fill-blank", question.Type);
        var legacy = EducationQuestionSeedFactory.Create(TextQuestion with { Options = [] }, "assessment", 1);
        Assert.Equal("[]", legacy.OptionsJson);
    }

    [Fact]
    public void Rejects_banks_without_an_accepted_answer_or_with_duplicate_choices()
    {
        Assert.Throws<ValidationAppException>(() => EducationQuestionSeedFactory.Create(TextQuestion with {
            Options = [new("a", "flower"), new("b", "leaf")] }, "assessment", 1));
        Assert.Throws<ValidationAppException>(() => EducationQuestionSeedFactory.Create(TextQuestion with {
            Options = [new("a", "root"), new("a", "flower")] }, "assessment", 1));
        Assert.Throws<ValidationAppException>(() => EducationQuestionSeedFactory.Create(TextQuestion with {
            Options = [new("a", "root"), new("b", "root")] }, "assessment", 1));
        Assert.Throws<ValidationAppException>(() => EducationQuestionSeedFactory.Create(TextQuestion with {
            Options = [new("a", "root")] }, "assessment", 1));
    }

    [Fact]
    public void Numeric_bank_uses_server_tolerance_and_rejects_non_numeric_distractors()
    {
        var request = TextQuestion with { FillMode = "number", AllowedTextAnswers = [], AllowedNumericAnswers = [3], NumericTolerance = .05m,
            Options = [new("a", "3.01"), new("b", "4")] };
        Assert.Equal("number", EducationQuestionSeedFactory.Create(request, "assessment", 1).FillMode);
        Assert.Throws<ValidationAppException>(() => EducationQuestionSeedFactory.Create(request with {
            Options = [new("a", "3"), new("b", "not a number")] }, "assessment", 1));
    }
}
