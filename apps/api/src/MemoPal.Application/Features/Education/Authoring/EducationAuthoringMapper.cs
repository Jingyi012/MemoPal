using System.Text.Json;
using System.Security.Cryptography;
using System.Text;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;

namespace MemoPal.Application.Features.Education.Authoring;

internal static class EducationAuthoringMapper
{
    private sealed record AnswerKey(string? CorrectOptionId, IReadOnlyList<string>? CorrectOptionIds,
        IReadOnlyList<string>? CorrectSequenceIds, bool? CorrectBooleanAnswer,
        IReadOnlyList<EducationOptionRequest>? MatchTargets, IReadOnlyList<ObjectiveQuestionMatch>? CorrectMatches,
        IReadOnlyList<string> AllowedTextAnswers, bool TrimTextAnswers, bool IgnoreCase,
        IReadOnlyList<decimal> AllowedNumericAnswers, decimal NumericTolerance, string? GradingRubric = null);

    public static EducationQuestion ApplyRequest(EducationQuestionRequest request, string assessmentId, int position, EducationQuestion? question = null)
    {
        if (request is null) throw new ValidationAppException("Question entries cannot be null.");
        var prompt = request.Prompt?.Trim();
        var explanation = request.Explanation?.Trim();
        var objectiveId = request.ObjectiveId?.Trim();
        if (string.IsNullOrWhiteSpace(prompt) || prompt.Length > 1000) throw new ValidationAppException("Question prompt is required and must be 1000 characters or fewer.");
        if (explanation?.Length > 2000) throw new ValidationAppException("Question explanations must be 2000 characters or fewer.");
        if (string.IsNullOrWhiteSpace(objectiveId)) throw new ValidationAppException("Question objective is required.");
        var type = request.Type?.Trim().ToLowerInvariant();
        var fillMode = request.FillMode?.Trim().ToLowerInvariant();
        if (!string.IsNullOrWhiteSpace(request.Id) && request.Id.Trim().Length > 64) throw new ValidationAppException("Question IDs must be 64 characters or fewer.");
        if (objectiveId.Length > 64) throw new ValidationAppException("Objective IDs must be 64 characters or fewer.");
        if ((request.Options ?? []).Any(x => x is null)) throw new ValidationAppException("Option entries cannot be null.");
        var matchingPairs = (request.MatchingPairs ?? []).ToArray();
        if (matchingPairs.Any(pair => pair is null || pair.Left is null || pair.Right is null))
            throw new ValidationAppException("Matching pairs cannot contain null items.");
        var options = type == ObjectiveQuestionTypeCodes.Matching
            ? matchingPairs.Select(pair => pair.Left).ToArray()
            : (request.Options ?? []).ToArray();
        var matchTargets = type == ObjectiveQuestionTypeCodes.Matching
            ? matchingPairs.Select(pair => pair.Right).ToArray()
            : [];
        if (request.MaxScore <= 0 || request.MaxScore > 99999999.99m || decimal.Round(request.MaxScore, 2) != request.MaxScore)
            throw new ValidationAppException("Question score must fit within 8 integer digits and 2 decimal places.");
        if (type is ObjectiveQuestionTypeCodes.WrittenResponse or ObjectiveQuestionTypeCodes.PhotoResponse or ObjectiveQuestionTypeCodes.VoiceResponse)
        {
            var rubric = request.GradingRubric?.Trim();
            if (string.IsNullOrWhiteSpace(rubric) || rubric.Length > 4000)
                throw new ValidationAppException("A grading rubric of 1–4000 characters is required for manual-response questions.");
            question ??= new EducationQuestion { Id = Guid.NewGuid().ToString("D") };
            question.AssessmentId = assessmentId;
            question.ObjectiveId = objectiveId;
            question.Prompt = prompt;
            question.Explanation = explanation;
            question.Type = type;
            question.FillMode = null;
            question.MaxScore = request.MaxScore;
            question.Position = position;
            question.OptionsJson = "[]";
            question.AnswerKeyJson = JsonSerializer.Serialize(new AnswerKey(null, [], [], null, [], [], [], false, false, [], 0, rubric));
            return question;
        }
        ObjectiveQuestionDefinition definition;
        try
        {
            definition = type switch
            {
                ObjectiveQuestionTypeCodes.SingleChoice => ObjectiveQuestionDefinition.SingleChoice(request.MaxScore, (request.Options ?? []).Select(x => new ObjectiveQuestionOption(x.Id, x.Label)), request.CorrectOptionId ?? string.Empty),
                ObjectiveQuestionTypeCodes.MultipleSelect => ObjectiveQuestionDefinition.MultipleSelect(request.MaxScore, (request.Options ?? []).Select(x => new ObjectiveQuestionOption(x.Id, x.Label)), request.CorrectOptionIds ?? []),
                ObjectiveQuestionTypeCodes.Ordering => ObjectiveQuestionDefinition.Ordering(request.MaxScore, (request.Options ?? []).Select(x => new ObjectiveQuestionOption(x.Id, x.Label)), request.CorrectSequenceIds ?? []),
                ObjectiveQuestionTypeCodes.Matching => ObjectiveQuestionDefinition.Matching(request.MaxScore,
                    options.Select(x => new ObjectiveQuestionOption(x.Id, x.Label)),
                    matchTargets.Select(x => new ObjectiveQuestionOption(x.Id, x.Label)),
                    matchingPairs.Select(pair => new ObjectiveQuestionMatch(pair.Left.Id, pair.Right.Id))),
                ObjectiveQuestionTypeCodes.TrueFalse => ObjectiveQuestionDefinition.TrueFalse(request.MaxScore, request.CorrectBooleanAnswer ?? throw new ArgumentException("True-false answer is required.")),
                ObjectiveQuestionTypeCodes.FillBlank when fillMode == FillBlankModeCodes.Text => ObjectiveQuestionDefinition.TextFillBlank(request.MaxScore, request.AllowedTextAnswers ?? [], request.TrimTextAnswers, request.IgnoreCase ? TextAnswerCasePolicy.Insensitive : TextAnswerCasePolicy.Sensitive),
                ObjectiveQuestionTypeCodes.FillBlank when fillMode == FillBlankModeCodes.Number => ObjectiveQuestionDefinition.NumericFillBlank(request.MaxScore, request.AllowedNumericAnswers ?? [], request.NumericTolerance),
                _ => throw new ArgumentException("Unsupported question type or fill mode.")
            };
        }
        catch (ArgumentException ex) { throw new ValidationAppException(ex.Message); }

        if ((definition.QuestionType is ObjectiveQuestionTypeCodes.SingleChoice or ObjectiveQuestionTypeCodes.MultipleSelect) && (options.Length is < 2 or > 4))
            throw new ValidationAppException("Choice questions require 2 to 4 options.");
        if (definition.QuestionType == ObjectiveQuestionTypeCodes.Ordering && (options.Length is < 2 or > 10))
            throw new ValidationAppException("Ordering questions require 2 to 10 items.");
        if (options.Any(x => string.IsNullOrWhiteSpace(x.Id) || x.Id.Length > 64)) throw new ValidationAppException("Option IDs are required and must be 64 characters or fewer.");
        if (options.Any(x => string.IsNullOrWhiteSpace(x.Label) || x.Label.Length > 500)) throw new ValidationAppException("Option labels are required and must be 500 characters or fewer.");
        if (matchTargets.Any(x => string.IsNullOrWhiteSpace(x.Id) || x.Id.Length > 64 ||
                string.IsNullOrWhiteSpace(x.Label) || x.Label.Length > 500))
            throw new ValidationAppException("Matching target IDs and labels are required and must fit the supported limits.");
        if ((request.AllowedTextAnswers?.Count ?? 0) > 20 || (request.AllowedTextAnswers ?? []).Any(x => x is null || x.Length > 500))
            throw new ValidationAppException("Text questions may have at most 20 accepted answers, each 500 characters or fewer.");
        if ((request.AllowedNumericAnswers?.Count ?? 0) > 20)
            throw new ValidationAppException("Numeric questions may have at most 20 accepted answers.");
        var correctIds = request.CorrectOptionIds ?? [];
        if (correctIds.Count > options.Length || correctIds.Any(string.IsNullOrWhiteSpace) || correctIds.Any(id => id.Length > 64))
            throw new ValidationAppException("Correct option IDs must be valid option IDs.");
        var answerKey = new AnswerKey(definition.CorrectOptionId, definition.CorrectOptionIds,
            definition.CorrectSequenceIds, definition.CorrectBooleanAnswer,
            definition.MatchTargets.Select(target => new EducationOptionRequest(target.Id, target.Text)).ToArray(),
            definition.CorrectMatches,
            definition.AllowedTextAnswers, definition.TrimTextAnswers, request.IgnoreCase,
            definition.AllowedNumericAnswers, definition.NumericTolerance);
        question ??= new EducationQuestion { Id = Guid.NewGuid().ToString("D") };
        question.AssessmentId = assessmentId;
        question.ObjectiveId = objectiveId;
        question.Prompt = prompt;
        question.Explanation = explanation;
        question.Type = definition.QuestionType;
        question.FillMode = definition.FillBlankMode;
        question.MaxScore = definition.MaxScore;
        question.Position = position;
        question.OptionsJson = JsonSerializer.Serialize(options);
        question.AnswerKeyJson = JsonSerializer.Serialize(answerKey);
        return question;
    }

    public static EducationAssessmentDto ToDto(EducationAssessment assessment) => new(
        assessment.Id, assessment.CourseId, assessment.Title, assessment.Status, assessment.Version,
        assessment.PublishedAt, assessment.Questions.Where(q => !q.IsDeleted).OrderBy(q => q.Position).Select(ToQuestionDto).ToArray(),
        assessment.IsPublicPractice);

    public static EducationStudentQuestionDto ToStudentDto(EducationQuestion question, bool includeExplanation = false)
    {
        var key = JsonSerializer.Deserialize<AnswerKey>(question.AnswerKeyJson) ?? throw new InvalidOperationException("Invalid stored answer key.");
        return new(question.Id, question.Prompt, question.Type, question.FillMode, question.MaxScore, question.ObjectiveId,
            JsonSerializer.Deserialize<EducationOptionRequest[]>(question.OptionsJson) ?? [], question.Position,
            key.MatchTargets?.OrderBy(target => Convert.ToHexString(SHA256.HashData(
                Encoding.UTF8.GetBytes($"{question.Id}:{target.Id}"))), StringComparer.Ordinal).ToArray() ?? [],
            includeExplanation ? question.Explanation : null);
    }

    private static EducationQuestionDto ToQuestionDto(EducationQuestion question)
    {
        var key = JsonSerializer.Deserialize<AnswerKey>(question.AnswerKeyJson) ?? throw new InvalidOperationException("Invalid stored answer key.");
        var options = JsonSerializer.Deserialize<EducationOptionRequest[]>(question.OptionsJson) ?? [];
        var targets = key.MatchTargets ?? [];
        var targetById = targets.ToDictionary(target => target.Id, StringComparer.Ordinal);
        var matchingPairs = question.Type == ObjectiveQuestionTypeCodes.Matching
            ? options.Select(option => new EducationMatchingPairRequest(option,
                targetById.TryGetValue(key.CorrectMatches?.FirstOrDefault(pair => pair.LeftOptionId == option.Id)?.MatchTargetId ?? string.Empty, out var target)
                    ? target
                    : throw new InvalidOperationException("Stored matching key is invalid."))).ToArray()
            : [];
        return new(question.Id, question.Prompt, question.Type, question.FillMode, question.MaxScore, question.ObjectiveId,
            options, key.CorrectOptionId,
            key.CorrectBooleanAnswer, key.AllowedTextAnswers, key.TrimTextAnswers, key.IgnoreCase,
            key.AllowedNumericAnswers, key.NumericTolerance, key.CorrectOptionIds ?? [], key.CorrectSequenceIds ?? [], matchingPairs,
            key.GradingRubric, question.Explanation);
    }
}
