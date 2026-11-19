using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using MemoPal.Application.Features.AiCredits;

namespace MemoPal.Application.Features.Education.Authoring;

public sealed record EstimateStudyCourseGenerationQuery(string UserId, EducationCourseAiInput Input) : IRequest<ApiResponse<StudyCourseGenerationEstimate>>;
public sealed record StudyCourseGenerationEstimate(bool Available, string? Reason, int TextCost, int MaxCredits, int AvailableCredits);
public sealed record GenerateStudyCourseDraftRequest(string RequestId, int MaxCredits, EducationCourseAiInput Input);
public sealed record GenerateStudyCourseDraftCommand(string UserId, GenerateStudyCourseDraftRequest Request)
    : IRequest<ApiResponse<StudyCourseGenerationResult>>;
public sealed record StudyCourseGenerationResult(string GenerationId, string Status, EducationCourseAiOutput? Output,
    int Charged, string InputHash);
public sealed record RecoverStudyCourseGenerationQuery(string UserId, string RequestId) : IRequest<ApiResponse<StudyCourseGenerationResult>>;

public sealed class EstimateStudyCourseGenerationHandler(IAiCredits credits, IEducationCourseAiGenerator generator)
    : IRequestHandler<EstimateStudyCourseGenerationQuery, ApiResponse<StudyCourseGenerationEstimate>>
{
    public async Task<ApiResponse<StudyCourseGenerationEstimate>> Handle(EstimateStudyCourseGenerationQuery query, CancellationToken ct)
    {
        var input = GenerateStudyCourseDraftCommandHandler.NormalizeInput(query.Input);
        var balance = await credits.BalanceAsync(query.UserId, ct);
        var missing = input.Units.SelectMany(x => x.Entries).Count(x => string.IsNullOrWhiteSpace(x.Meaning));
        var count = Math.Clamp(missing + input.Units.Sum(x => Math.Max(1, Math.Min(8, x.Entries.Count))), 1, 100);
        return ApiResponse<StudyCourseGenerationEstimate>.Ok(new(generator.IsConfigured,
            generator.IsConfigured ? null : "AI text generation is not configured. You can still save the content and prepare questions from meanings you provide.",
            generator.IsConfigured ? balance.TextCost : 0, generator.IsConfigured ? count * balance.TextCost : 0, balance.Available));
    }
}

public sealed class GenerateStudyCourseDraftCommandHandler(IEducationCourseAiGenerator generator, IAiCredits credits)
    : IRequestHandler<GenerateStudyCourseDraftCommand, ApiResponse<StudyCourseGenerationResult>>
{
    public async Task<ApiResponse<StudyCourseGenerationResult>> Handle(GenerateStudyCourseDraftCommand command, CancellationToken ct)
    {
        var input = NormalizeInput(command.Request.Input);
        if (!generator.IsConfigured) throw new AppException("AI text generation is not configured. Save the content or add meanings manually.", 503);
        var missing = input.Units.SelectMany(x => x.Entries).Count(x => string.IsNullOrWhiteSpace(x.Meaning));
        var count = Math.Clamp(missing + input.Units.Sum(x => Math.Max(1, Math.Min(8, x.Entries.Count))), 1, 100);
        var json = JsonSerializer.Serialize(input, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(json))).ToLowerInvariant();
        var wrapped = await CreditGeneration.RunAsync(credits, command.UserId, command.Request.RequestId, "education-course-text",
            new { Input = input, InputHash = hash }, count, async token =>
            {
                var output = ValidateOutput(input, await generator.GenerateAsync(input, token));
                var successful = output.Suggestions.Count(x => !x.NeedsReview && !string.IsNullOrWhiteSpace(x.Meaning)) + output.Questions.Count(x => !x.IsRuleBased);
                var missing = input.Units.SelectMany(x => x.Entries).Count(x => string.IsNullOrWhiteSpace(x.Meaning));
                var completedMeanings = output.Suggestions.Count(x => !x.NeedsReview);
                var partial = output.FailedBatchCount > 0 || output.Suggestions.Any(x => x.NeedsReview) || completedMeanings < missing;
                return (new StudyCourseGenerationResult("", partial ? "partial" : "completed", output, 0, hash), successful);
            }, ct, command.Request.MaxCredits);
        // The credit service owns generation ID; result lookup fills the ID from its reservation below.
        var job = await credits.GenerationForRequestAsync(command.UserId, command.Request.RequestId, ct);
        return ApiResponse<StudyCourseGenerationResult>.Ok(wrapped with { GenerationId = job?.Id ?? "", Charged = job?.Charged ?? 0 });
    }

    internal static EducationCourseAiInput NormalizeInput(EducationCourseAiInput input)
    {
        if (input is null || string.IsNullOrWhiteSpace(input.Title) || input.Title.Length > 200 ||
            input.LanguageCode is not ("zh-Hans" or "zh-Hant" or "en" or "ms") ||
            input.MeaningLanguageCode is not ("zh-Hans" or "zh-Hant" or "en" or "ms") ||
            input.ContentType is not ("LanguageItem" or "VocabularyPair" or "ConceptUnderstanding" or "VerbatimText") ||
            input.Units is null || input.Units.Count is < 1 or > 50 ||
            input.Units.Any(x => x is null || string.IsNullOrWhiteSpace(x.Id) || x.Id.Length > 80 || string.IsNullOrWhiteSpace(x.Title) || x.Title.Length > 200 || x.Entries is null || x.Entries.Count == 0 || x.Entries.Any(entry => entry is null)) ||
            input.Units.Select(x => x.Id).Distinct(StringComparer.Ordinal).Count() != input.Units.Count ||
            input.Units.Sum(x => x.Entries.Count) is < 1 or > 50)
            throw new ValidationAppException("Provide between 1 and 50 learning entries in non-empty units.");
        if (input.Difficulty is not ("basic" or "advanced")) throw new ValidationAppException("Choose a supported difficulty.");
        var ids = input.Units.SelectMany(x => x.Entries).Select(x => x.Id).ToArray();
        if (ids.Any(x => string.IsNullOrWhiteSpace(x) || x.Length > 80) || ids.Distinct(StringComparer.Ordinal).Count() != ids.Length)
            throw new ValidationAppException("Every entry must have a unique stable ID.");
        foreach (var entry in input.Units.SelectMany(x => x.Entries))
            if (string.IsNullOrWhiteSpace(entry.Text) || entry.Text.Length > 500 || entry.Meaning?.Length > 500)
                throw new ValidationAppException("Words and meanings must be between 1 and 500 characters.");
        return input;
    }

    private static EducationCourseAiOutput ValidateOutput(EducationCourseAiInput input, EducationCourseAiOutput output)
    {
        if (output is null) throw new AppException("The generated content could not be safely checked. Try again or save your content without AI.", 422);
        var entries = input.Units.SelectMany(x => x.Entries).ToDictionary(x => x.Id, StringComparer.Ordinal);
        var units = input.Units.ToDictionary(x => x.Id, StringComparer.Ordinal);
        var suggestions = (output.Suggestions ?? []).Where(x => x is not null && !string.IsNullOrWhiteSpace(x.EntryId) && entries.TryGetValue(x.EntryId, out var entry) &&
                string.IsNullOrWhiteSpace(entry.Meaning) && !string.IsNullOrWhiteSpace(x.Meaning) && x.Meaning!.Length <= 500)
            .Select(x => x with { NeedsReview = x.NeedsReview || MeaningNeedsReview(input.MeaningLanguageCode, entries[x.EntryId], x.Meaning!) })
            .GroupBy(x => x.EntryId, StringComparer.Ordinal).Select(x => x.First()).ToArray();
        var suggestedMeanings = suggestions.ToDictionary(x => x.EntryId, x => x.Meaning, StringComparer.Ordinal);
        var questions = new List<EducationCourseAiQuestion>();
        foreach (var question in output.Questions ?? [])
        {
            if (question is null || string.IsNullOrWhiteSpace(question.UnitId) || string.IsNullOrWhiteSpace(question.EntryId) ||
                !units.TryGetValue(question.UnitId, out var unit) || !unit.Entries.Any(entry => entry.Id == question.EntryId) ||
                question.Prompt?.Length is not (> 0 and <= 500) || question.Explanation?.Length > 500) continue;
            var entry = entries[question.EntryId];
            if (input.ContentType == "ConceptUnderstanding" && !string.IsNullOrWhiteSpace(entry.Meaning) &&
                EducationCourseAiQuestionRules.TryInvertExplicitNegation(input.LanguageCode, entry.Text, entry.Meaning, out _)) continue;
            var acceptedQuestion = question;
            if (question.Type == "single-choice")
            {
                var reliableMeaning = entry.Meaning;
                if (reliableMeaning is null && suggestedMeanings.TryGetValue(entry.Id, out var suggestion) && !suggestions.Single(x => x.EntryId == entry.Id).NeedsReview) reliableMeaning = suggestion;
                var sameUnitMeanings = unit.Entries.Where(x => x.Id != entry.Id).Select(x => x.Meaning ??
                    (suggestions.FirstOrDefault(s => s.EntryId == x.Id && !s.NeedsReview)?.Meaning))
                    .Where(x => !string.IsNullOrWhiteSpace(x)).ToHashSet(StringComparer.OrdinalIgnoreCase);
                if (reliableMeaning is null || question.Options is not { Count: >= 2 and <= 4 } || question.Options.Any(string.IsNullOrWhiteSpace) ||
                    question.Options.Any(x => x.Length > 200) || question.Options.Distinct(StringComparer.OrdinalIgnoreCase).Count() != question.Options.Count ||
                    question.CorrectOptionIndex < 0 || question.CorrectOptionIndex >= question.Options.Count ||
                    question.Options[question.CorrectOptionIndex] != reliableMeaning ||
                    question.Options.Where((_, index) => index != question.CorrectOptionIndex).Any(x => !sameUnitMeanings.Contains(x)) ||
                    question.Options.Any(x => x.Contains(entry.Text, StringComparison.OrdinalIgnoreCase))) continue;
                acceptedQuestion = question with { Prompt = EducationCourseAiQuestionRules.MeaningPrompt(input.LanguageCode, input.ContentType, entry.Text),
                    Explanation = EducationCourseAiQuestionRules.MeaningExplanation(input.LanguageCode, input.ContentType, entry.Text, reliableMeaning,
                        aiSuggested: string.IsNullOrWhiteSpace(entry.Meaning)) };
            }
            else continue;
            var unitQuestions = questions.Count(x => x.UnitId == question.UnitId);
            if (unitQuestions < Math.Min(8, unit.Entries.Count) && !questions.Any(x => x.EntryId == question.EntryId && x.UnitId == question.UnitId)) questions.Add(acceptedQuestion);
        }
        // Build matching and fill-blank items from known word/meaning pairs. The provider never
        // supplies these answers, so each question stays anchored to source material.
        var suggestionById = suggestions.ToDictionary(x => x.EntryId, StringComparer.Ordinal);
        foreach (var unit in input.Units)
        {
            // Recognition and active recall are different practice tasks. A matching question
            // must not consume every entry's chance to get its own recall question.
            var room = Math.Max(0, Math.Min(8, unit.Entries.Count * 2 + 1) - questions.Count(x => x.UnitId == unit.Id));
            var covered = questions.Where(x => x.UnitId == unit.Id).Select(x => x.EntryId).ToHashSet(StringComparer.Ordinal);
            if (input.ContentType == "ConceptUnderstanding")
            {
                foreach (var entry in unit.Entries.Where(x => !covered.Contains(x.Id) && !string.IsNullOrWhiteSpace(x.Meaning)))
                {
                    if (room == 0) break;
                    if (!EducationCourseAiQuestionRules.TryInvertExplicitNegation(input.LanguageCode, entry.Text, entry.Meaning!, out var inverted) || inverted.Length > 500) continue;
                    questions.Add(new EducationCourseAiQuestion(unit.Id, entry.Id,
                        EducationCourseAiQuestionRules.TrueFalsePrompt(input.LanguageCode, entry.Text, inverted), "true-false", [], -1, null,
                        EducationCourseAiQuestionRules.TrueFalseExplanation(input.LanguageCode, entry.Meaning!), true, CorrectBooleanAnswer: false));
                    covered.Add(entry.Id);
                    room--;
                }
            }
            if (input.ContentType == "VerbatimText")
            {
                foreach (var entry in unit.Entries.Where(x => !covered.Contains(x.Id)))
                {
                    if (room == 0) break;
                    if (!EducationCourseAiQuestionRules.TrySentenceTokens(input.LanguageCode, entry.Text, out var tokens)) continue;
                    var displayTokens = tokens.Reverse().ToArray();
                    var correctSequence = tokens.Select(token => $"option-{Array.IndexOf(displayTokens, token) + 1}").ToArray();
                    questions.Add(new EducationCourseAiQuestion(unit.Id, entry.Id,
                        input.LanguageCode.StartsWith("zh", StringComparison.Ordinal) ? "按学习资料中的原句顺序排列" : "Arrange the words in the order of the original sentence",
                        "ordering", displayTokens, -1, null, input.LanguageCode.StartsWith("zh", StringComparison.Ordinal) ? $"原句：“{entry.Text}”" : $"Original sentence: “{entry.Text}”",
                        true, CorrectSequenceIds: correctSequence));
                    covered.Add(entry.Id);
                    room--;
                }
            }
            var matchingItems = unit.Entries.Select(entry =>
            {
                var meaning = entry.Meaning;
                if (string.IsNullOrWhiteSpace(meaning) && suggestionById.TryGetValue(entry.Id, out var suggestion) && !suggestion.NeedsReview)
                    meaning = suggestion.Meaning;
                return (Entry: entry, Meaning: meaning);
            }).Where(x => !covered.Contains(x.Entry.Id) && !string.IsNullOrWhiteSpace(x.Meaning) &&
                (input.ContentType is "ConceptUnderstanding" or "VerbatimText" || !x.Meaning!.Contains(x.Entry.Text, StringComparison.OrdinalIgnoreCase)))
                .GroupBy(x => x.Meaning!, StringComparer.OrdinalIgnoreCase).Select(x => x.First()).Take(5).ToArray();
            if (room > 0 && matchingItems.Length >= 2)
            {
                var pairs = matchingItems.Select(x => new EducationCourseAiMatchingPair(x.Entry.Id, x.Entry.Text, x.Meaning!)).ToArray();
                questions.Add(new EducationCourseAiQuestion(unit.Id, pairs[0].EntryId,
                    input.LanguageCode.StartsWith("zh", StringComparison.Ordinal) ? "将词语与意思配对" : "Match each word with its meaning",
                    "matching", [], -1, null, null, true, pairs));
                covered.UnionWith(pairs.Select(x => x.EntryId));
                room--;
            }
            foreach (var item in unit.Entries)
            {
                if (room == 0) break;
                if (questions.Any(question => question.UnitId == unit.Id && question.EntryId == item.Id &&
                    question.Type is "fill-blank" or "true-false" or "ordering")) continue;
                var meaning = item.Meaning;
                if (string.IsNullOrWhiteSpace(meaning) && suggestionById.TryGetValue(item.Id, out var suggestion) && !suggestion.NeedsReview)
                    meaning = suggestion.Meaning;
                if (string.IsNullOrWhiteSpace(meaning) ||
                    (input.ContentType is "LanguageItem" or "VocabularyPair" && meaning.Contains(item.Text, StringComparison.OrdinalIgnoreCase))) continue;
                if (input.ContentType == "VerbatimText")
                {
                    if (meaning.Contains(item.Text, StringComparison.OrdinalIgnoreCase)) continue;
                    var prompt = input.LanguageCode.StartsWith("zh", StringComparison.Ordinal)
                        ? $"根据提示还原原句，保留原有标点：{meaning}"
                        : $"Restore the original sentence from this clue and keep its punctuation: {meaning}";
                    questions.Add(new EducationCourseAiQuestion(unit.Id, item.Id,
                        prompt, "fill-blank", [], -1, item.Text, input.LanguageCode.StartsWith("zh", StringComparison.Ordinal)
                            ? $"原句：“{item.Text}”" : $"Original sentence: “{item.Text}”.", true));
                }
                else
                {
                    var conceptClue = input.ContentType == "ConceptUnderstanding"
                        ? meaning.Replace(item.Text, "____", StringComparison.OrdinalIgnoreCase) : meaning;
                    if (input.ContentType == "ConceptUnderstanding" && conceptClue.Contains(item.Text, StringComparison.OrdinalIgnoreCase)) continue;
                    var prompt = input.ContentType == "ConceptUnderstanding"
                        ? input.LanguageCode.StartsWith("zh", StringComparison.Ordinal) ? $"根据说明写出对应知识点：{conceptClue}" : $"Write the concept represented by these notes: {conceptClue}"
                        : input.LanguageCode.StartsWith("zh", StringComparison.Ordinal) ? $"根据提示写词语：{meaning}" : $"Write the word for this clue: {meaning}";
                    var explanation = input.ContentType == "ConceptUnderstanding"
                        ? EducationCourseAiQuestionRules.MeaningExplanation(input.LanguageCode, input.ContentType, item.Text, meaning!, aiSuggested: string.IsNullOrWhiteSpace(item.Meaning) && suggestionById.ContainsKey(item.Id))
                        : null;
                    questions.Add(new EducationCourseAiQuestion(unit.Id, item.Id, prompt, "fill-blank", [], -1, item.Text, explanation, true));
                }
                room--;
            }
        }
        if (suggestions.Length == 0 && questions.Count == 0)
            throw new AppException("The generated content could not be safely checked. Try again or save your content without AI.", 422);
        return new(suggestions, questions, output.FailedBatchCount);
    }

    private static bool MeaningNeedsReview(string language, EducationCourseAiEntry entry, string meaning)
    {
        var normalizedSource = string.Concat(entry.Text.Normalize(NormalizationForm.FormKC).Where(char.IsLetterOrDigit));
        var normalizedMeaning = string.Concat(meaning.Normalize(NormalizationForm.FormKC).Where(char.IsLetterOrDigit));
        if (string.Equals(normalizedSource, normalizedMeaning, StringComparison.OrdinalIgnoreCase)) return true;
        if (language is "zh-Hans" or "zh-Hant") return !meaning.EnumerateRunes().Any(rune => rune.Value is >= 0x3400 and <= 0x9FFF or >= 0xF900 and <= 0xFAFF);
        return !meaning.EnumerateRunes().Any(rune => rune.Value is >= 0x0041 and <= 0x024F);
    }
}

public sealed class RecoverStudyCourseGenerationQueryHandler(IAppDbContext db)
    : IRequestHandler<RecoverStudyCourseGenerationQuery, ApiResponse<StudyCourseGenerationResult>>
{
    public async Task<ApiResponse<StudyCourseGenerationResult>> Handle(RecoverStudyCourseGenerationQuery query, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(query.RequestId) || query.RequestId.Length > 64)
            throw new ValidationAppException("A requestId of 1-64 characters is required for AI generation recovery.");
        var job = await db.AiGenerations.AsNoTracking().SingleOrDefaultAsync(x => x.UserId == query.UserId &&
            x.RequestId == query.RequestId && x.Kind == "education-course-text", ct)
            ?? throw new NotFoundAppException("Course generation was not found.");
        if (job.Status != "completed" || string.IsNullOrWhiteSpace(job.ResultJson))
            return ApiResponse<StudyCourseGenerationResult>.Ok(new(job.Id, job.Status, null, job.Charged, ""));
        var result = JsonSerializer.Deserialize<StudyCourseGenerationResult>(job.ResultJson, new JsonSerializerOptions(JsonSerializerDefaults.Web))
            ?? throw new NotFoundAppException("Course generation result was not found.");
        return ApiResponse<StudyCourseGenerationResult>.Ok(result with { GenerationId = job.Id, Charged = job.Charged });
    }
}
