using System.Globalization;
using MemoPal.Domain.Education;

namespace MemoPal.UnitTests;

public sealed class EducationQuestionScoringTests
{
    [Fact]
    public void SingleChoiceGradesByStableOptionId()
    {
        var question = ObjectiveQuestionDefinition.SingleChoice(2, Options(), "green");

        Assert.Equal(new ObjectiveQuestionGrade(2, 2, true),
            ObjectiveQuestionScorer.Grade(question, ObjectiveQuestionAnswerInput.SingleChoice("green")));
        Assert.Equal(new ObjectiveQuestionGrade(0, 2, false),
            ObjectiveQuestionScorer.Grade(question, ObjectiveQuestionAnswerInput.SingleChoice("red")));
    }

    [Fact]
    public void MultipleSelectRequiresExactSetOfDistinctOwnedOptions()
    {
        var question = ObjectiveQuestionDefinition.MultipleSelect(3, Options().Append(new("blue", "Blue")), ["green", "blue"]);

        Assert.True(ObjectiveQuestionScorer.Grade(question, ObjectiveQuestionAnswerInput.MultipleSelect(["blue", "green"])).IsCorrect);
        Assert.False(ObjectiveQuestionScorer.Grade(question, ObjectiveQuestionAnswerInput.MultipleSelect(["green"])).IsCorrect);
        Assert.False(ObjectiveQuestionScorer.Grade(question, ObjectiveQuestionAnswerInput.MultipleSelect(["green", "red"])).IsCorrect);
        Assert.Throws<ArgumentException>(() => ObjectiveQuestionScorer.Grade(question, ObjectiveQuestionAnswerInput.MultipleSelect(["green", "green"])));
        Assert.Throws<ArgumentException>(() => ObjectiveQuestionScorer.Grade(question, ObjectiveQuestionAnswerInput.MultipleSelect(["foreign", "green"])));
        Assert.Throws<ArgumentException>(() => ObjectiveQuestionDefinition.MultipleSelect(1, Options(), ["green", "foreign"]));
    }

    [Fact]
    public void OrderingRequiresEveryOwnedItemExactlyOnceInTheCorrectSequence()
    {
        var question = ObjectiveQuestionDefinition.Ordering(2, Options().Append(new("blue", "Blue")), ["red", "green", "blue"]);

        Assert.True(ObjectiveQuestionScorer.Grade(question,
            ObjectiveQuestionAnswerInput.Ordering(["red", "green", "blue"])).IsCorrect);
        Assert.False(ObjectiveQuestionScorer.Grade(question,
            ObjectiveQuestionAnswerInput.Ordering(["green", "red", "blue"])).IsCorrect);
        Assert.Throws<ArgumentException>(() => ObjectiveQuestionScorer.Grade(question,
            ObjectiveQuestionAnswerInput.Ordering(["red", "red", "blue"])));
        Assert.Throws<ArgumentException>(() => ObjectiveQuestionScorer.Grade(question,
            ObjectiveQuestionAnswerInput.Ordering(["red", "green", "foreign"])));
        Assert.Throws<ArgumentException>(() => ObjectiveQuestionDefinition.Ordering(1, Options(), ["green", "foreign"]));
        Assert.Throws<ArgumentException>(() => ObjectiveQuestionDefinition.Ordering(1, Options(), ["green", "red"]));
    }

    [Fact]
    public void MatchingAwardsEqualPointsPerCorrectPairAndValidatesUniqueOwnedItems()
    {
        var question = ObjectiveQuestionDefinition.Matching(3, Options(),
            [new("one", "One"), new("two", "Two")],
            [new("green", "two"), new("red", "one")]);

        Assert.Equal(new ObjectiveQuestionGrade(3, 3, true), ObjectiveQuestionScorer.Grade(question,
            ObjectiveQuestionAnswerInput.Matching([new("green", "two"), new("red", "one")])));
        Assert.Equal(new ObjectiveQuestionGrade(1.5m, 3, false), ObjectiveQuestionScorer.Grade(question,
            ObjectiveQuestionAnswerInput.Matching([new("green", "two")])));
        Assert.Throws<ArgumentException>(() => ObjectiveQuestionScorer.Grade(question,
            ObjectiveQuestionAnswerInput.Matching([new("green", "one"), new("green", "two")])));
        Assert.Throws<ArgumentException>(() => ObjectiveQuestionScorer.Grade(question,
            ObjectiveQuestionAnswerInput.Matching([new("green", "foreign")])));
        Assert.Throws<ArgumentException>(() => ObjectiveQuestionDefinition.Matching(1, Options(),
            [new("one", "One"), new("one", "Duplicate")],
            [new("green", "one"), new("red", "one")]));
    }

    [Fact]
    public void TrueFalseGradesBothOutcomes()
    {
        var question = ObjectiveQuestionDefinition.TrueFalse(1, false);

        Assert.True(ObjectiveQuestionScorer.Grade(question, ObjectiveQuestionAnswerInput.TrueFalse(false)).IsCorrect);
        Assert.False(ObjectiveQuestionScorer.Grade(question, ObjectiveQuestionAnswerInput.TrueFalse(true)).IsCorrect);
    }

    [Fact]
    public void TextFillBlankUsesExplicitTrimAndCasePolicies()
    {
        var question = ObjectiveQuestionDefinition.TextFillBlank(3, ["MemoPal", "Memo Pal"], true, TextAnswerCasePolicy.Insensitive);

        Assert.Equal(3, ObjectiveQuestionScorer.Grade(question, ObjectiveQuestionAnswerInput.Text("  MEMOPAL ")).Score);
        var strict = ObjectiveQuestionDefinition.TextFillBlank(1, ["cat"], false, TextAnswerCasePolicy.Sensitive);
        Assert.False(ObjectiveQuestionScorer.Grade(strict, ObjectiveQuestionAnswerInput.Text("Cat")).IsCorrect);
        Assert.False(ObjectiveQuestionScorer.Grade(strict, ObjectiveQuestionAnswerInput.Text("cat ")).IsCorrect);
    }

    [Fact]
    public void NumberFillBlankParsesInvariantDecimalAndAppliesOnlyConfiguredTolerance()
    {
        var originalCulture = CultureInfo.CurrentCulture;
        var originalUiCulture = CultureInfo.CurrentUICulture;
        try
        {
            CultureInfo.CurrentCulture = CultureInfo.GetCultureInfo("fr-FR");
            CultureInfo.CurrentUICulture = CultureInfo.GetCultureInfo("fr-FR");
            var question = ObjectiveQuestionDefinition.NumericFillBlank(2, [1.25m], 0.01m);

            Assert.True(ObjectiveQuestionScorer.Grade(question, ObjectiveQuestionAnswerInput.Number("1.259")).IsCorrect);
            Assert.False(ObjectiveQuestionScorer.Grade(question, ObjectiveQuestionAnswerInput.Number("1.261")).IsCorrect);
            Assert.Throws<ArgumentException>(() => ObjectiveQuestionScorer.Grade(question, ObjectiveQuestionAnswerInput.Number("1,25")));
            Assert.Throws<ArgumentException>(() => ObjectiveQuestionScorer.Grade(question, ObjectiveQuestionAnswerInput.Number("one")));
        }
        finally
        {
            CultureInfo.CurrentCulture = originalCulture;
            CultureInfo.CurrentUICulture = originalUiCulture;
        }
    }

    [Fact]
    public void NumberFillBlankHandlesDecimalExtremesWithoutOverflow()
    {
        var maxQuestion = ObjectiveQuestionDefinition.NumericFillBlank(1, [decimal.MaxValue]);
        var minQuestion = ObjectiveQuestionDefinition.NumericFillBlank(1, [decimal.MinValue]);

        Assert.True(ObjectiveQuestionScorer.Grade(maxQuestion,
            ObjectiveQuestionAnswerInput.Number(decimal.MaxValue.ToString(CultureInfo.InvariantCulture))).IsCorrect);
        Assert.True(ObjectiveQuestionScorer.Grade(minQuestion,
            ObjectiveQuestionAnswerInput.Number(decimal.MinValue.ToString(CultureInfo.InvariantCulture))).IsCorrect);
        Assert.False(ObjectiveQuestionScorer.Grade(maxQuestion,
            ObjectiveQuestionAnswerInput.Number(decimal.MinValue.ToString(CultureInfo.InvariantCulture))).IsCorrect);
        Assert.False(ObjectiveQuestionScorer.Grade(minQuestion,
            ObjectiveQuestionAnswerInput.Number(decimal.MaxValue.ToString(CultureInfo.InvariantCulture))).IsCorrect);
    }

    [Fact]
    public void DefinitionCopiesMutableInputsAndExposesReadOnlyCollections()
    {
        var options = Options().ToList();
        var question = ObjectiveQuestionDefinition.SingleChoice(1, options, "green");
        options.Clear();

        Assert.Equal(2, question.Options.Count);
        Assert.Throws<NotSupportedException>(() => ((IList<ObjectiveQuestionOption>)question.Options).Clear());
    }

    [Fact]
    public void InvalidDefinitionsAreRejected()
    {
        Assert.Throws<ArgumentException>(() => ObjectiveQuestionDefinition.SingleChoice(1, Options(), "foreign"));
        Assert.Throws<ArgumentException>(() => ObjectiveQuestionDefinition.SingleChoice(1,
            [new("same", "A"), new("same", "B")], "same"));
        Assert.Throws<ArgumentException>(() => ObjectiveQuestionDefinition.SingleChoice(0, Options(), "green"));
        Assert.Throws<ArgumentException>(() => ObjectiveQuestionDefinition.TextFillBlank(1, [" "], true, TextAnswerCasePolicy.Sensitive));
        Assert.Throws<ArgumentException>(() => ObjectiveQuestionDefinition.TextFillBlank(1, ["yes"], true, (TextAnswerCasePolicy)99));
        Assert.Throws<ArgumentException>(() => ObjectiveQuestionDefinition.NumericFillBlank(1, [1m], -0.1m));
        Assert.Throws<ArgumentException>(() => ObjectiveQuestionDefinition.SingleChoice(1,
            new ObjectiveQuestionOption[] { new("valid", "A"), null! }, "valid"));
    }

    [Fact]
    public void AnswerShapeAndForeignOptionIdsAreRejected()
    {
        var choice = ObjectiveQuestionDefinition.SingleChoice(1, Options(), "green");
        var truth = ObjectiveQuestionDefinition.TrueFalse(1, true);
        var text = ObjectiveQuestionDefinition.TextFillBlank(1, ["yes"], true, TextAnswerCasePolicy.Sensitive);

        Assert.Throws<ArgumentException>(() => ObjectiveQuestionScorer.Grade(choice, ObjectiveQuestionAnswerInput.SingleChoice("foreign")));
        Assert.Throws<ArgumentException>(() => ObjectiveQuestionScorer.Grade(choice, ObjectiveQuestionAnswerInput.Text("green")));
        Assert.Throws<ArgumentException>(() => ObjectiveQuestionScorer.Grade(truth, ObjectiveQuestionAnswerInput.SingleChoice("green")));
        Assert.Throws<ArgumentException>(() => ObjectiveQuestionScorer.Grade(text, ObjectiveQuestionAnswerInput.Number("1")));
    }

    private static ObjectiveQuestionOption[] Options() =>
    [
        new("green", "Green"),
        new("red", "Red")
    ];
}
