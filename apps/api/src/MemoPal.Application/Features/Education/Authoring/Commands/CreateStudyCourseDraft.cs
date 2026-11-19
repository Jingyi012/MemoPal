using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using MemoPal.Application.Features.Education.StudyItems;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Authoring;

public sealed record StudyCourseDraftEntry(string Text, string? Meaning, string? StableId = null);
public sealed record StudyCourseDraftUnit(string Title, IReadOnlyList<StudyCourseDraftEntry> Entries, string? StableId = null);
public sealed record CreateStudyCourseDraftRequest(string Title, string LanguageCode, IReadOnlyList<StudyCourseDraftEntry>? Entries = null, int? GroupSize = null,
    IReadOnlyList<StudyCourseDraftUnit>? Units = null, bool StartLearning = false, string? SourceDraftId = null,
    string? GenerationId = null, string? MeaningLanguageCode = null, string Difficulty = "basic",
    IReadOnlyList<string>? ConfirmedSuggestionIds = null, IReadOnlyList<int>? IncludedQuestionIndexes = null,
    string MemoryContentType = "LanguageItem");
public sealed record StudyCourseDraftResult(string CourseId, int StudyItemCount, int PracticeQuestionCount, bool AlreadyExists, bool ReadyToLearn = false);
public sealed record CreateStudyCourseDraftCommand(string UserId, CreateStudyCourseDraftRequest Request)
    : IRequest<ApiResponse<StudyCourseDraftResult>>;

public sealed class CreateStudyCourseDraftHandler(IAppDbContext db)
    : IRequestHandler<CreateStudyCourseDraftCommand, ApiResponse<StudyCourseDraftResult>>
{
    public async Task<ApiResponse<StudyCourseDraftResult>> Handle(CreateStudyCourseDraftCommand command, CancellationToken ct)
    {
        var request = command.Request;
        EducationCourseAiOutput? generatedOutput = null;
        EducationCourseAiInput? generationInput = null;
        if (request.GenerationId is not null)
        {
            var generation = await db.AiGenerations.AsNoTracking().SingleOrDefaultAsync(x => x.Id == request.GenerationId &&
                x.UserId == command.UserId && x.Kind == "education-course-text" && x.Status == "completed", ct)
                ?? throw new NotFoundAppException("Completed course generation not found.");
            var snapshot = JsonSerializer.Deserialize<CourseGenerationSnapshot>(generation.InputJson ?? "{}", new JsonSerializerOptions(JsonSerializerDefaults.Web));
            var result = JsonSerializer.Deserialize<StudyCourseGenerationResult>(generation.ResultJson ?? "{}", new JsonSerializerOptions(JsonSerializerDefaults.Web));
            if (snapshot?.Input is null || result?.Output is null || snapshot.InputHash != result.InputHash)
                throw new ConflictAppException("This generated preview is no longer available. Prepare it again.");
            generationInput = snapshot.Input;
            generatedOutput = result.Output;
            ValidateAdoption(request, generationInput, generatedOutput);
        }
        EducationCourse? sourceDraft = null;
        if (request.SourceDraftId is not null)
        {
            sourceDraft = await db.EducationCourses.FirstOrDefaultAsync(x => x.Id == request.SourceDraftId && x.Id.StartsWith("import-") && x.UserId == command.UserId &&
                !x.IsModerationHidden && !x.IsPublic, ct)
                ?? throw new NotFoundAppException("Private draft not found.");

        }
        var title = AuthoringValidation.Title(request.Title, "Course");
        var language = EducationStudyItemValidation.Language(request.LanguageCode)
            ?? throw new ValidationAppException("Choose a content language.");
        var zh = language.StartsWith("zh", StringComparison.Ordinal);
        if (!Enum.TryParse<EducationMemoryContentType>(request.MemoryContentType, ignoreCase: false, out var memoryContentType) ||
            memoryContentType is not (EducationMemoryContentType.LanguageItem or EducationMemoryContentType.VocabularyPair or
                EducationMemoryContentType.ConceptUnderstanding or EducationMemoryContentType.VerbatimText))
            throw new ValidationAppException("Choose a supported learning content type.");
        if (request.GroupSize is < 1 or > 50)
            throw new ValidationAppException("Group size must be between 1 and 50.");
        if (request.Units is not null && (request.Entries is not null || request.GroupSize is not null))
            throw new ValidationAppException("Provide named units or a flat word list, not both.");
        IReadOnlyList<StudyCourseDraftUnit> sourceUnits;
        var groupSize = 0;
        if (request.Units is not null)
        {
            if (request.Units.Count is < 1 or > 50 || request.Units.Any(x => x is null || x.Entries is null || x.Entries.Count == 0))
                throw new ValidationAppException("Each unit must contain at least one learning entry.");
            sourceUnits = request.Units.Select(x => new StudyCourseDraftUnit(AuthoringValidation.Title(x.Title, "Unit"), x.Entries, x.StableId)).ToArray();
        }
        else
        {
            if (request.Entries is null || request.Entries.Count is < 1 or > 50)
                throw new ValidationAppException("Provide between 1 and 50 learning entries.");
            groupSize = Math.Min(request.GroupSize ?? request.Entries.Count, request.Entries.Count);
            sourceUnits = request.Entries.Chunk(groupSize).Select((chunk, index) => new StudyCourseDraftUnit(
                request.Entries.Count <= groupSize ? title : zh ? $"单元 {index + 1}" : $"Unit {index + 1}", chunk)).ToArray();
        }
        var sourceEntries = sourceUnits.SelectMany(x => x.Entries).ToArray();
        if (sourceEntries.Length is < 1 or > 50 || sourceEntries.Any(x => x is null))
            throw new ValidationAppException("Provide between 1 and 50 learning entries in total.");
        var entryNumber = 0;
        var units = sourceUnits.Select(unit => new {
            Id = unit.StableId,
            unit.Title,
            Entries = unit.Entries.Select((entry, index) => EducationStudyItemValidation.Normalize(
                     new EducationObjectiveStudyItemRequest(request.GenerationId is null ? $"entry-{++entryNumber}" : entry.StableId ?? $"entry-{++entryNumber}", index + 1, memoryContentType.ToString(), entry.Text,
                    entry.Meaning, LanguageCode: language))).ToArray()
        }).ToArray();
        var entries = units.SelectMany(x => x.Entries).ToArray();
        if (entries.Select(x => x.Primary).Distinct(StringComparer.OrdinalIgnoreCase).Count() != entries.Length)
            throw new ValidationAppException("Learning entries must be unique. Review duplicate words before creating the draft.");
        // Legacy list imports keep their retry identity. Named units include names and order.
        var legacyUnits = units.Select(unit => new { unit.Title, unit.Entries }).ToArray();
        var fingerprint = request.GenerationId is null && memoryContentType == EducationMemoryContentType.LanguageItem
            ? request.Units is null
                ? JsonSerializer.Serialize(new { command.UserId, Title = title, Language = language, Entries = entries, GroupSize = groupSize, ImportVersion = 2 })
                : JsonSerializer.Serialize(new { command.UserId, Title = title, Language = language, Units = legacyUnits, ImportVersion = 3 })
            : JsonSerializer.Serialize(new { command.UserId, Title = title, Language = language, Units = units, ImportVersion = 4,
                GenerationId = request.GenerationId, GenerationVersion = 1, ContentType = memoryContentType,
                ConfirmedSuggestionIds = (request.ConfirmedSuggestionIds ?? []).Distinct(StringComparer.Ordinal).Order(StringComparer.Ordinal).ToArray(),
                IncludedQuestionIndexes = (request.IncludedQuestionIndexes ?? Enumerable.Range(0, generatedOutput?.Questions.Count ?? 0)).Distinct().Order().ToArray() });
        var courseId = "import-" + Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(fingerprint)))[..56].ToLowerInvariant();
        var existing = await FindExisting(courseId, command.UserId, ct);
        if (sourceDraft is not null && sourceDraft.Id != courseId)
        {
            if (sourceDraft.IsDeleted && existing is null) throw new NotFoundAppException("Private draft not found.");
            if (await db.EducationObjectiveStudyItems.AnyAsync(x => x.Objective != null && !x.Objective.IsDeleted && x.Objective.CourseId == sourceDraft.Id &&
                    !x.IsDeleted && x.Status == EducationStudyItemStatus.Published, ct))
                throw new ConflictAppException("Learning has already started. Create a copy to keep the existing learning record.");
        }
        if (existing is not null && request.StartLearning && await db.EducationCourses.AnyAsync(x => x.Id == courseId && x.IsPublic, ct))
            throw new ConflictAppException("This content is already public. Change the name to create a private copy.");
        if (existing is not null)
        {
            if (request.StartLearning && !existing.ReadyToLearn) await MakeReady(courseId, ct);
            if (sourceDraft is not null && sourceDraft.Id != courseId) sourceDraft.IsDeleted = true;
            await db.SaveChangesAsync(ct);
            return ApiResponse<StudyCourseDraftResult>.Ok((await FindExisting(courseId, command.UserId, ct))!);
        }
        var course = new EducationCourse { Id = courseId, UserId = command.UserId, Title = title, LanguageCode = language,
            SubjectCode = zh ? "chinese" : language == "en" ? "english" : null, OutlineVersion = 1 };
        var questionCount = 0;
        for (var index = 0; index < units.Length; index++)
        {
            var number = index + 1;
            var unitTitle = units[index].Title;
            var unit = new EducationCourseUnit { CourseId = course.Id, Title = unitTitle, Position = number - 1 };
            db.EducationCourseUnits.Add(unit);
            var objective = new EducationObjective { CourseId = course.Id, UnitId = unit.Id, UnitPosition = 0,
                Title = unitTitle, LanguageCode = language,
                SubjectCode = course.SubjectCode, MemoryContentType = memoryContentType,
                ContentOrigin = EducationContentOrigin.Imported, ReviewStatus = EducationContentReviewStatus.Unreviewed };
            var assessment = new EducationAssessment { CourseId = course.Id, UserId = command.UserId, Title = objective.Title };
            foreach (var entry in units[index].Entries)
            {
                objective.StudyItems.Add(new EducationObjectiveStudyItem { ObjectiveId = objective.Id, StableKey = entry.StableKey!,
                    Position = entry.Position, Kind = memoryContentType, Primary = entry.Primary,
                    Secondary = entry.Secondary, LanguageCode = language });
                if (request.GenerationId is null)
                {
                    if (memoryContentType == EducationMemoryContentType.VerbatimText &&
                        EducationCourseAiQuestionRules.TrySentenceTokens(language, entry.Primary, out var sentenceTokens))
                    {
                        var displayTokens = sentenceTokens.Reverse().ToArray();
                        var sentenceOptions = displayTokens.Select((token, tokenIndex) => new EducationOptionRequest($"option-{tokenIndex + 1}", token)).ToArray();
                        var correctSequenceIds = sentenceTokens.Select(token => $"option-{Array.IndexOf(displayTokens, token) + 1}").ToArray();
                        assessment.Questions.Add(EducationQuestionSeedFactory.Create(new EducationQuestionRequest(null,
                            language.StartsWith("zh", StringComparison.Ordinal) ? "按学习资料中的原句顺序排列" : "Arrange the words in the order of the original sentence",
                            "ordering", null, 1, objective.Id, sentenceOptions,
                            CorrectSequenceIds: correctSequenceIds,
                            Explanation: language.StartsWith("zh", StringComparison.Ordinal) ? $"原句：“{entry.Primary}”" : $"Original sentence: “{entry.Primary}”"),
                            assessment.Id, assessment.Questions.Count + 1));
                    }
                    else if (entry.Secondary is not null && (memoryContentType is EducationMemoryContentType.ConceptUnderstanding or EducationMemoryContentType.VerbatimText ||
                             !entry.Secondary.Contains(entry.Primary, StringComparison.OrdinalIgnoreCase)))
                    {
                        var prompt = memoryContentType switch
                        {
                            EducationMemoryContentType.ConceptUnderstanding => language.StartsWith("zh", StringComparison.Ordinal)
                                ? $"根据说明写出对应知识点：{entry.Secondary}" : $"Write the concept described by these notes: {entry.Secondary}",
                            EducationMemoryContentType.VerbatimText => language.StartsWith("zh", StringComparison.Ordinal)
                                ? $"根据说明写出对应原句：{entry.Secondary}" : $"Write the original sentence described by this clue: {entry.Secondary}",
                            _ => language.StartsWith("zh", StringComparison.Ordinal)
                                ? $"根据提示写词语：{entry.Secondary}" : $"Write the word for this clue: {entry.Secondary}"
                        };
                        if (memoryContentType is EducationMemoryContentType.ConceptUnderstanding or EducationMemoryContentType.VerbatimText &&
                            entry.Secondary.Contains(entry.Primary, StringComparison.OrdinalIgnoreCase)) continue;
                        var explanation = memoryContentType == EducationMemoryContentType.ConceptUnderstanding
                            ? EducationCourseAiQuestionRules.MeaningExplanation(language, "ConceptUnderstanding", entry.Primary, entry.Secondary)
                            : null;
                        assessment.Questions.Add(EducationQuestionSeedFactory.Create(new EducationQuestionRequest(null, prompt,
                            "fill-blank", "text", 1, objective.Id, AllowedTextAnswers: [entry.Primary], TrimTextAnswers: true,
                            IgnoreCase: true, Explanation: explanation), assessment.Id, assessment.Questions.Count + 1));
                    }
                    else continue;
                    questionCount++;
                }
            }
            if (generatedOutput is not null && generationInput is not null)
            {
                var generationUnit = generationInput.Units.FirstOrDefault(x => x.Id == sourceUnits[index].StableId);
                if (generationUnit is null) continue;
                foreach (var (suggestion, questionIndex) in generatedOutput.Questions.Select((question, index) => (question, index)).Where(x => x.question.UnitId == generationUnit.Id))
                {
                    if (!entries.Any(entry => entry.StableKey == suggestion.EntryId)) continue;
                    if (request.IncludedQuestionIndexes is not null && !request.IncludedQuestionIndexes.Contains(questionIndex)) continue;
                    var sourceEntry = generationUnit.Entries.Single(entry => entry.Id == suggestion.EntryId);
                    var adoptedEntry = units[index].Entries.FirstOrDefault(entry => entry.StableKey == suggestion.EntryId);
                    if (adoptedEntry is null) continue;
                    var approvedSuggestion = generatedOutput.Suggestions.FirstOrDefault(x => x.EntryId == suggestion.EntryId);
                    var unchangedMeaning = adoptedEntry.Secondary == sourceEntry.Meaning;
                    var acceptedSuggestion = approvedSuggestion is not null && adoptedEntry.Secondary == approvedSuggestion.Meaning &&
                        !MeaningRepeatsWord(sourceEntry.Text, approvedSuggestion.Meaning) &&
                        (!approvedSuggestion.NeedsReview || request.ConfirmedSuggestionIds?.Contains(suggestion.EntryId) == true);
                    if (!unchangedMeaning && !acceptedSuggestion) continue;
                    if (adoptedEntry.Primary != sourceEntry.Text) continue;
                    if (suggestion.Type == "single-choice")
                    {
                        var staleDistractor = suggestion.Options.Where((_, optionIndex) => optionIndex != suggestion.CorrectOptionIndex).Any(option =>
                            !generationUnit.Entries.Any(source => source.Id != suggestion.EntryId &&
                                units[index].Entries.Any(current => current.StableKey == source.Id && current.Primary == source.Text &&
                                    (current.Secondary == source.Meaning || current.Secondary == generatedOutput.Suggestions.FirstOrDefault(x => x.EntryId == source.Id && !x.NeedsReview)?.Meaning) &&
                                    current.Secondary == option)));
                        if (staleDistractor) continue;
                    }
                    else if (suggestion.IsRuleBased && suggestion.Type == "fill-blank")
                    {
                        var clue = adoptedEntry.Secondary;
                        var expectedPrompt = generationInput.ContentType switch
                        {
                            "ConceptUnderstanding" => zh
                                ? $"根据说明写出对应知识点：{clue?.Replace(sourceEntry.Text, "____", StringComparison.OrdinalIgnoreCase)}"
                                : $"Write the concept represented by these notes: {clue?.Replace(sourceEntry.Text, "____", StringComparison.OrdinalIgnoreCase)}",
                            "VerbatimText" => zh ? $"根据提示还原原句，保留原有标点：{clue}" : $"Restore the original sentence from this clue and keep its punctuation: {clue}",
                            _ => zh ? $"根据提示写词语：{clue}" : $"Write the word for this clue: {clue}"
                        };
                        if (suggestion.Answer != sourceEntry.Text || suggestion.Prompt != expectedPrompt ||
                            generationInput.ContentType is "ConceptUnderstanding" or "VerbatimText" &&
                            suggestion.Prompt.Contains(sourceEntry.Text, StringComparison.OrdinalIgnoreCase)) continue;
                        var expectedExplanation = generationInput.ContentType switch
                        {
                            "ConceptUnderstanding" => EducationCourseAiQuestionRules.MeaningExplanation(language, "ConceptUnderstanding", sourceEntry.Text, clue ?? "",
                                aiSuggested: sourceEntry.Meaning is null && approvedSuggestion is not null),
                            "VerbatimText" => zh ? $"原句：“{sourceEntry.Text}”" : $"Original sentence: “{sourceEntry.Text}”",
                            _ => suggestion.Explanation
                        };
                        if (suggestion.Explanation != expectedExplanation) continue;
                    }
                    EducationQuestionRequest? question = null;
                    if (suggestion.Type == "single-choice" && suggestion.Options.Count is >= 2 and <= 4)
                    {
                        var options = suggestion.Options.Select((label, optionIndex) => new EducationOptionRequest($"option-{optionIndex + 1}", label)).ToArray();
                        question = new EducationQuestionRequest(null, suggestion.Prompt, "single-choice", null, 1, objective.Id, options,
                            CorrectOptionId: options[suggestion.CorrectOptionIndex].Id, Explanation: suggestion.Explanation);
                    }
                    else if (suggestion.Type == "fill-blank" && !string.IsNullOrWhiteSpace(suggestion.Answer))
                        question = new EducationQuestionRequest(null, suggestion.Prompt, "fill-blank", "text", 1, objective.Id,
                            AllowedTextAnswers: [suggestion.Answer], TrimTextAnswers: true, IgnoreCase: true, Explanation: suggestion.Explanation);
                    else if (suggestion.Type == "matching" && suggestion.Pairs is { Count: >= 2 and <= 5 })
                    {
                        var pairs = new List<EducationMatchingPairRequest>();
                        var validPairs = true;
                        foreach (var (pair, pairIndex) in suggestion.Pairs.Select((pair, index) => (pair, index)))
                        {
                            var source = generationUnit.Entries.FirstOrDefault(x => x.Id == pair.EntryId);
                            var current = units[index].Entries.FirstOrDefault(x => x.StableKey == pair.EntryId);
                            var pairSuggestion = generatedOutput.Suggestions.FirstOrDefault(x => x.EntryId == pair.EntryId);
                            var approvedMeaning = source?.Meaning == current?.Secondary || pairSuggestion is not null &&
                                current?.Secondary == pairSuggestion.Meaning && !MeaningRepeatsWord(source?.Text, pairSuggestion.Meaning) &&
                                (!pairSuggestion.NeedsReview || request.ConfirmedSuggestionIds?.Contains(pair.EntryId) == true);
                            if (source is null || current is null || !approvedMeaning || source.Text != current.Primary ||
                                pair.Left != source.Text || pair.Right != current.Secondary)
                            {
                                validPairs = false;
                                break;
                            }
                            pairs.Add(new EducationMatchingPairRequest(
                                new EducationOptionRequest($"left-{pairIndex + 1}", pair.Left),
                                new EducationOptionRequest($"right-{pairIndex + 1}", pair.Right)));
                        }
                        if (validPairs && pairs.Count == suggestion.Pairs.Count)
                            question = new EducationQuestionRequest(null, suggestion.Prompt, "matching", null, 1, objective.Id,
                                MatchingPairs: pairs);
                    }
                    else if (suggestion.Type == "true-false" && suggestion.IsRuleBased && suggestion.CorrectBooleanAnswer.HasValue &&
                             generationInput.ContentType == "ConceptUnderstanding" && sourceEntry.Meaning == adoptedEntry.Secondary &&
                             EducationCourseAiQuestionRules.TryInvertExplicitNegation(language, sourceEntry.Text, sourceEntry.Meaning ?? "", out var inverted))
                    {
                        var statement = suggestion.CorrectBooleanAnswer.Value ? sourceEntry.Meaning! : inverted;
                        var expectedPrompt = EducationCourseAiQuestionRules.TrueFalsePrompt(language, sourceEntry.Text, statement);
                        var expectedExplanation = EducationCourseAiQuestionRules.TrueFalseExplanation(language, sourceEntry.Meaning!);
                        if (suggestion.Prompt == expectedPrompt && suggestion.Explanation == expectedExplanation)
                            question = new EducationQuestionRequest(null, expectedPrompt, "true-false", null, 1, objective.Id,
                                CorrectBooleanAnswer: suggestion.CorrectBooleanAnswer, Explanation: expectedExplanation);
                    }
                    else if (suggestion.Type == "ordering" && suggestion.IsRuleBased && generationInput.ContentType == "VerbatimText" &&
                             EducationCourseAiQuestionRules.TrySentenceTokens(language, sourceEntry.Text, out var sentenceTokens) &&
                             suggestion.Options.Count == sentenceTokens.Length && suggestion.Options.Distinct(StringComparer.Ordinal).Count() == sentenceTokens.Length &&
                             suggestion.Options.Order(StringComparer.Ordinal).SequenceEqual(sentenceTokens.Order(StringComparer.Ordinal), StringComparer.Ordinal) &&
                             !suggestion.Options.SequenceEqual(sentenceTokens) &&
                             suggestion.CorrectSequenceIds?.SequenceEqual(sentenceTokens.Select(token => $"option-{Array.IndexOf(suggestion.Options.ToArray(), token) + 1}")) == true)
                    {
                        var options = suggestion.Options.Select((token, tokenIndex) => new EducationOptionRequest($"option-{tokenIndex + 1}", token)).ToArray();
                        var expectedPrompt = zh ? "按学习资料中的原句顺序排列" : "Arrange the words in the order of the original sentence";
                        var expectedExplanation = zh ? $"原句：“{sourceEntry.Text}”" : $"Original sentence: “{sourceEntry.Text}”";
                        if (suggestion.Prompt == expectedPrompt && suggestion.Explanation == expectedExplanation)
                            question = new EducationQuestionRequest(null, expectedPrompt, "ordering", null, 1, objective.Id, options,
                                CorrectSequenceIds: suggestion.CorrectSequenceIds, Explanation: expectedExplanation);
                    }
                    if (question is null) continue;
                    assessment.Questions.Add(EducationQuestionSeedFactory.Create(question, assessment.Id, assessment.Questions.Count + 1));
                    questionCount++;
                }
            }
            course.Objectives.Add(objective);
            if (assessment.Questions.Count > 0) course.Assessments.Add(assessment);
        }
        if (request.StartLearning)
        {
            foreach (var objective in course.Objectives)
                foreach (var item in objective.StudyItems) item.SetPublished(true, null, DateTime.UtcNow);
            foreach (var assessment in course.Assessments)
            {
                assessment.Publish(DateTime.UtcNow);
            }
        }
        if (sourceDraft is not null && sourceDraft.Id != courseId) sourceDraft.IsDeleted = true;
        db.EducationCourses.Add(course);
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateException)
        {
            db.ClearTracking();
            var concurrent = await FindExisting(courseId, command.UserId, ct);
            if (concurrent is null) throw;
            if (request.StartLearning && !concurrent.ReadyToLearn) await MakeReady(courseId, ct);
            if (request.SourceDraftId is not null && request.SourceDraftId != courseId)
            {
                var previous = await db.EducationCourses.FirstOrDefaultAsync(x => x.Id == request.SourceDraftId && x.UserId == command.UserId, ct);
                if (previous is not null) previous.IsDeleted = true;
            }
            await db.SaveChangesAsync(ct);
            return ApiResponse<StudyCourseDraftResult>.Ok((await FindExisting(courseId, command.UserId, ct))!);
        }
        return ApiResponse<StudyCourseDraftResult>.Ok(new(course.Id, entries.Length, questionCount, false, request.StartLearning));
    }

    private async Task MakeReady(string courseId, CancellationToken ct)
    {
        var items = await db.EducationObjectiveStudyItems.Where(x => x.Objective != null && !x.Objective.IsDeleted && x.Objective.CourseId == courseId && !x.IsDeleted).ToListAsync(ct);
        foreach (var item in items.Where(x => x.Status != EducationStudyItemStatus.Published)) item.SetPublished(true, null, DateTime.UtcNow);
        var assessments = await db.EducationAssessments.Include(x => x.Questions).Where(x => x.CourseId == courseId && !x.IsDeleted).ToListAsync(ct);
        foreach (var assessment in assessments.Where(x => x.Status != EducationAssessmentStatuses.Published))
        {
            assessment.Publish(DateTime.UtcNow);
        }
    }

    private sealed record CourseGenerationSnapshot(EducationCourseAiInput Input, string InputHash);

    private static void ValidateAdoption(CreateStudyCourseDraftRequest request, EducationCourseAiInput input, EducationCourseAiOutput output)
    {
        if (request.Units is null || request.Units.Count is < 1 or > 50 || request.Title.Trim() != input.Title || request.LanguageCode != input.LanguageCode ||
            request.MeaningLanguageCode != input.MeaningLanguageCode || request.Difficulty != input.Difficulty ||
            request.MemoryContentType != input.ContentType ||
            request.Units.Any(x => x is null || x.StableId is null || x.Entries is null || x.Entries.Count == 0) ||
            request.Units.Select(x => x.StableId).Distinct(StringComparer.Ordinal).Count() != request.Units.Count ||
             request.Units.Any(x => string.IsNullOrWhiteSpace(x.StableId)))
            throw new ConflictAppException("Course content changed after generation. Prepare a new preview before saving.");
        var suggestionIds = output.Suggestions.Select(x => x.EntryId).ToHashSet(StringComparer.Ordinal);
        if (request.ConfirmedSuggestionIds?.Any(id => !suggestionIds.Contains(id)) == true)
            throw new ConflictAppException("A suggestion is no longer available. Prepare a new preview before saving.");
        if (request.ConfirmedSuggestionIds?.Any(id =>
            output.Suggestions.Any(suggestion => suggestion.EntryId == id && input.Units.SelectMany(unit => unit.Entries)
                .Any(entry => entry.Id == id && MeaningRepeatsWord(entry.Text, suggestion.Meaning)))) == true)
            throw new ConflictAppException("A repeated source word is not a valid meaning suggestion. Edit the meaning before adopting it.");
        if (request.IncludedQuestionIndexes?.Any(index => index < 0 || index >= output.Questions.Count) == true ||
            request.IncludedQuestionIndexes?.Distinct().Count() != request.IncludedQuestionIndexes?.Count)
            throw new ConflictAppException("A practice question is no longer available. Prepare a new preview before saving.");
        var adoptedEntryIds = new HashSet<string>(StringComparer.Ordinal);
        foreach (var adoptedUnit in request.Units)
        {
            var sourceUnit = input.Units.Single(x => x.Id == adoptedUnit.StableId);
            foreach (var adopted in adoptedUnit.Entries)
            {
                if (string.IsNullOrWhiteSpace(adopted.StableId) || !adoptedEntryIds.Add(adopted.StableId) ||
                    adopted.StableId.Length > 100 ||
                    string.IsNullOrWhiteSpace(adopted.Text) || adopted.Text.Length > 500 || adopted.Meaning?.Length > 500)
                    throw new ConflictAppException("A generated entry changed. Prepare a new preview before saving.");
            }
        }
    }

    private static bool MeaningRepeatsWord(string? word, string? meaning)
    {
        if (string.IsNullOrWhiteSpace(word) || string.IsNullOrWhiteSpace(meaning)) return false;
        static string Normalize(string value) => string.Concat(value.EnumerateRunes()
            .Where(Rune.IsLetterOrDigit).Select(Rune.ToLowerInvariant));
        var normalizedWord = Normalize(word);
        return normalizedWord.Length > 0 && normalizedWord == Normalize(meaning);
    }

    private async Task<StudyCourseDraftResult?> FindExisting(string courseId, string userId, CancellationToken ct)
    {
        var course = await db.EducationCourses.IgnoreQueryFilters().AsNoTracking().FirstOrDefaultAsync(x => x.Id == courseId, ct);
        if (course is null) return null;
        if (course.UserId != userId || course.IsDeleted || course.IsModerationHidden)
            throw new ConflictAppException("This source import is no longer available.");
        var objectiveIds = db.EducationObjectives.Where(x => x.CourseId == courseId && !x.IsDeleted).Select(x => x.Id);
        var assessmentIds = db.EducationAssessments.Where(x => x.CourseId == courseId && !x.IsDeleted).Select(x => x.Id);
        return new(courseId, await db.EducationObjectiveStudyItems.CountAsync(x => objectiveIds.Contains(x.ObjectiveId) && !x.IsDeleted, ct),
            await db.EducationQuestions.CountAsync(x => assessmentIds.Contains(x.AssessmentId) && !x.IsDeleted, ct), true,
            await db.EducationObjectiveStudyItems.AnyAsync(x => objectiveIds.Contains(x.ObjectiveId) && !x.IsDeleted, ct) &&
            !await db.EducationObjectiveStudyItems.AnyAsync(x => objectiveIds.Contains(x.ObjectiveId) && !x.IsDeleted && x.Status != EducationStudyItemStatus.Published, ct));
    }
}
