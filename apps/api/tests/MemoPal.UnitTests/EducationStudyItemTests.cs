using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using MemoPal.Application.Features.Education.StudyItems;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;

namespace MemoPal.UnitTests;

public sealed class EducationStudyItemTests
{
    [Fact]
    public void Supported_memory_types_parse_and_unknown_values_fail()
    {
        Assert.Equal(EducationMemoryContentType.LanguageItem,
            EducationStudyItemValidation.ParseEnum<EducationMemoryContentType>("LanguageItem", "kind"));
        Assert.Throws<ValidationAppException>(() => EducationStudyItemValidation.ParseEnum<EducationMemoryContentType>("MadeUp", "kind"));
    }

    [Fact]
    public void Text_is_nfc_normalized_and_unicode_code_points_are_counted()
    {
        var composed = EducationStudyItemValidation.Clean("e\u0301", 1, "Primary", true);
        Assert.Equal("é", composed);
        var supplementary500 = string.Concat(Enumerable.Repeat("𠀀", 500));
        Assert.Equal(supplementary500, EducationStudyItemValidation.Clean(supplementary500, 500, "Primary", true));
        Assert.Throws<ValidationAppException>(() => EducationStudyItemValidation.Clean(supplementary500 + "𠀀", 500, "Primary", true));
    }

    [Theory]
    [InlineData("\u200B")]
    [InlineData("\u200D")]
    [InlineData("\uFEFF")]
    [InlineData("\u0001")]
    public void Zero_width_and_control_characters_are_rejected(string forbidden)
    {
        Assert.Throws<ValidationAppException>(() => EducationStudyItemValidation.Clean($"中{forbidden}文", 10, "Primary", true));
    }

    [Fact]
    public void Grade_codes_accept_supported_malaysia_levels_and_future_regions()
    {
        foreach (var grade in new[] { "MY-P1", "MY-P6", "MY-F1", "MY-F5", "CN-JH1", "MY-K1", "my-p1" })
            Assert.Equal(grade.ToUpperInvariant(), EducationStudyItemValidation.GradeCode(grade));
        foreach (var grade in new[] { "MY-P0", "MY-P7", "MY-F6", "MY-1", "MY-PRIMARY-1" })
            Assert.Throws<ValidationAppException>(() => EducationStudyItemValidation.GradeCode(grade));
    }

    [Fact]
    public void Language_override_is_preserved_and_restricted_to_supported_codes()
    {
        var request = new EducationObjectiveStudyItemRequest(null, 1, "LanguageItem", "cell", "细胞", "xì bāo", null, null, null, "en");
        var normalized = EducationStudyItemValidation.Normalize(request);
        Assert.Equal("en", normalized.LanguageCode);
        Assert.Null(EducationStudyItemValidation.Language(null));
        Assert.Throws<ValidationAppException>(() => EducationStudyItemValidation.Language("fr", "LanguageCode"));
    }

    [Fact]
    public void Missing_stable_key_is_content_derived_and_explicit_key_is_stable()
    {
        var request = new EducationObjectiveStudyItemRequest(null, 1, "VocabularyPair", "学习", "study", null, null, null, null, "zh-Hans");
        var normalized = EducationStudyItemValidation.Normalize(request);
        var first = EducationStudyItemValidation.StableKey(normalized);
        Assert.Equal(first, EducationStudyItemValidation.StableKey(normalized));
        var explicitKey = EducationStudyItemValidation.Normalize(request with { StableKey = "lesson-word-1" });
        Assert.Equal("lesson-word-1", EducationStudyItemValidation.StableKey(explicitKey));
    }

    [Fact]
    public void Ordered_list_requires_unique_contiguous_positions_and_limits_items()
    {
        var good = new[] { new EducationObjectiveStudyItem { Position = 1 }, new EducationObjectiveStudyItem { Position = 2 } };
        ImportObjectiveStudyItemsHandler.EnsureValidPositions(good, EducationMemoryContentType.OrderedList);
        var gap = new[] { new EducationObjectiveStudyItem { Position = 1 }, new EducationObjectiveStudyItem { Position = 3 } };
        Assert.Throws<ValidationAppException>(() => ImportObjectiveStudyItemsHandler.EnsureValidPositions(gap, EducationMemoryContentType.OrderedList));
        var duplicate = new[] { new EducationObjectiveStudyItem { Position = 1 }, new EducationObjectiveStudyItem { Position = 1 } };
        Assert.Throws<ValidationAppException>(() => ImportObjectiveStudyItemsHandler.EnsureValidPositions(duplicate, EducationMemoryContentType.VocabularyPair));
        Assert.Throws<ValidationAppException>(() => ImportObjectiveStudyItemsHandler.EnsureValidPositions(
            Enumerable.Range(1, 101).Select(position => new EducationObjectiveStudyItem { Position = position }).ToArray(), EducationMemoryContentType.NotApplicable));
    }

    [Fact]
    public void Public_publication_confirmation_is_recorded_and_retract_changes_status()
    {
        var item = new EducationObjectiveStudyItem();
        item.SetPublished(true, "author-1", DateTime.UtcNow);
        Assert.Equal(EducationStudyItemStatus.Published, item.Status);
        Assert.Equal("author-1", item.NotConfidentialExamContentConfirmedByUserId);
        Assert.NotNull(item.NotConfidentialExamContentConfirmedAtUtc);
        var version = item.ContentVersion;
        item.SetPublished(false, null, DateTime.UtcNow);
        Assert.Equal(EducationStudyItemStatus.Draft, item.Status);
        Assert.True(item.ContentVersion > version);
    }
}
