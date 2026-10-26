using MemoPal.Application.Features.Education.MemoryBridge;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;

namespace MemoPal.UnitTests;

public sealed class EducationMemoryDerivationTests
{
    [Theory]
    [InlineData(EducationMemoryContentType.VocabularyPair, "细胞", "cell", null, null, "细胞", "cell", null)]
    [InlineData(EducationMemoryContentType.OrderedList, "观察", null, null, null, "第 3 步", "观察", null)]
    [InlineData(EducationMemoryContentType.NumberDate, "日期", "10月1日", null, null, "日期", "10月1日", null)]
    [InlineData(EducationMemoryContentType.CategoryMembership, "哺乳动物", "鲸", null, null, "哺乳动物", "鲸", null)]
    [InlineData(EducationMemoryContentType.FormulaSymbols, "H₂O", "水", null, null, "H₂O", "水", null)]
    [InlineData(EducationMemoryContentType.LabelDiagram, "心脏", "左心室", null, null, "心脏", "左心室", null)]
    [InlineData(EducationMemoryContentType.VerbatimText, "春风吹绿枝头", null, null, null, "第 3 句/段", "春风吹绿枝头", null)]
    [InlineData(EducationMemoryContentType.LanguageItem, "春天", "一年的第一个季节", "chūntiān", "季节提示", "春天", "拼音：chūntiān\n释义：一年的第一个季节", "季节提示")]
    public void Every_supported_study_item_kind_maps_to_private_memory_fields(
        EducationMemoryContentType kind, string primary, string? secondary, string? phonetic, string? extra,
        string expectedPrompt, string expectedAnswer, string? expectedHint)
    {
        var objective = new EducationObjective { Title = "知识点", LanguageCode = "zh-Hans" };
        var item = new EducationObjectiveStudyItem
        {
            Kind = kind, Position = 3, Primary = primary, Secondary = secondary, Phonetic = phonetic, Extra = extra
        };

        var mapped = EducationMemoryDerivationRules.Map(objective, item);

        Assert.Equal(expectedPrompt, mapped.Prompt);
        Assert.Equal(expectedAnswer, mapped.Answer);
        Assert.Equal(expectedHint, mapped.Hint);
    }

    [Theory]
    [InlineData(EducationMemoryContentType.NotApplicable)]
    [InlineData(EducationMemoryContentType.ConceptUnderstanding)]
    [InlineData(EducationMemoryContentType.ReasoningProcedure)]
    public void Reasoning_and_unclassified_content_is_rejected(EducationMemoryContentType kind)
    {
        var exception = Assert.Throws<EducationMemoryDerivationRuleException>(() =>
            EducationMemoryDerivationRules.Map(new EducationObjective(), new EducationObjectiveStudyItem
            {
                Kind = kind, Primary = "内容", Secondary = "解释"
            }));
        Assert.Equal("NotSuitableForMemoryTechnique", exception.ReasonCode);
    }

    [Fact]
    public void Hash_is_independent_of_query_order_whitespace_and_unicode_composition_but_tracks_position()
    {
        var objective = new EducationObjective { LanguageCode = "zh-Hans" };
        var first = new EducationObjectiveStudyItem
        {
            Id = "a", StableKey = "one", Position = 1, Kind = EducationMemoryContentType.VocabularyPair,
            Primary = " e\u0301 ", Secondary = " 释义\r\n内容 "
        };
        var second = new EducationObjectiveStudyItem
        {
            Id = "b", StableKey = "two", Position = 2, Kind = EducationMemoryContentType.VocabularyPair,
            Primary = "春天", Secondary = "季节"
        };
        var equivalent = new EducationObjectiveStudyItem
        {
            Id = "a", StableKey = "one", Position = 1, Kind = EducationMemoryContentType.VocabularyPair,
            Primary = "é", Secondary = "释义 内容"
        };

        Assert.Equal(EducationMemoryDerivationRules.SourceHash(objective, [first, second]),
            EducationMemoryDerivationRules.SourceHash(objective, [second, equivalent]));
        Assert.NotEqual(EducationMemoryDerivationRules.SourceHash(objective, [first, second]),
            EducationMemoryDerivationRules.SourceHash(objective, [first, new EducationObjectiveStudyItem
            {
                Id = second.Id, StableKey = second.StableKey, Position = 3, Kind = second.Kind,
                Primary = second.Primary, Secondary = second.Secondary
            }]));
    }

    [Fact]
    public void Mapped_text_length_does_not_truncate_and_preserves_the_existing_memory_limit()
    {
        var objective = new EducationObjective();
        var valid = new EducationObjectiveStudyItem
        {
            Kind = EducationMemoryContentType.VocabularyPair,
            Primary = string.Concat(Enumerable.Repeat("𠀀", 250)), Secondary = "answer"
        };
        Assert.Equal(250, EducationMemoryDerivationRules.CountRunes(EducationMemoryDerivationRules.Map(objective, valid).Prompt));
        var invalid = new EducationObjectiveStudyItem
        {
            Kind = valid.Kind, Primary = valid.Primary + "𠀀", Secondary = valid.Secondary
        };
        var exception = Assert.Throws<EducationMemoryDerivationRuleException>(() => EducationMemoryDerivationRules.Map(objective, invalid));
        Assert.Equal("MappedFieldTooLong", exception.ReasonCode);
    }

    [Fact]
    public void Technique_capacity_accepts_one_through_one_hundred_and_rejects_empty_or_over_limit()
    {
        EducationMemoryDerivationRules.ValidateCapacity(1);
        EducationMemoryDerivationRules.ValidateCapacity(100);
        Assert.Equal("NoPublishedItems", Assert.Throws<EducationMemoryDerivationRuleException>(
            () => EducationMemoryDerivationRules.ValidateCapacity(0)).ReasonCode);
        Assert.Equal("TechniqueCapacityExceeded", Assert.Throws<EducationMemoryDerivationRuleException>(
            () => EducationMemoryDerivationRules.ValidateCapacity(101)).ReasonCode);
    }
}
