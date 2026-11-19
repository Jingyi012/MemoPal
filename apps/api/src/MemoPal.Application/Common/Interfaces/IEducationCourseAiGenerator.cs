namespace MemoPal.Application.Common.Interfaces;

public sealed record EducationCourseAiEntry(string Id, string Text, string? Meaning);
public sealed record EducationCourseAiUnit(string Id, string Title, IReadOnlyList<EducationCourseAiEntry> Entries);
public sealed record EducationCourseAiInput(string Title, string LanguageCode, string MeaningLanguageCode,
    string Difficulty, IReadOnlyList<EducationCourseAiUnit> Units, string ContentType = "LanguageItem");
public sealed record EducationCourseAiEntrySuggestion(string EntryId, string? Meaning, bool NeedsReview);
public sealed record EducationCourseAiQuestion(string UnitId, string EntryId, string Prompt, string Type,
    IReadOnlyList<string> Options, int CorrectOptionIndex, string? Answer, string? Explanation, bool IsRuleBased = false,
    IReadOnlyList<EducationCourseAiMatchingPair>? Pairs = null, bool? CorrectBooleanAnswer = null,
    IReadOnlyList<string>? CorrectSequenceIds = null);
public sealed record EducationCourseAiMatchingPair(string EntryId, string Left, string Right);
public sealed record EducationCourseAiOutput(IReadOnlyList<EducationCourseAiEntrySuggestion> Suggestions,
    IReadOnlyList<EducationCourseAiQuestion> Questions, int FailedBatchCount = 0);

public interface IEducationCourseAiGenerator
{
    bool IsConfigured { get; }
    Task<EducationCourseAiOutput> GenerateAsync(EducationCourseAiInput input, CancellationToken ct);
}
