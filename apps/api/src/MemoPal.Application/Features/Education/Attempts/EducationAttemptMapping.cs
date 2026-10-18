using System.Text.Json;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Features.Education.Attempts.DTOs;
using MemoPal.Application.Features.Education.Authoring;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;

namespace MemoPal.Application.Features.Education.Attempts;

internal static class EducationAttemptMapping
{
    private sealed record StoredAnswerKey(string? CorrectOptionId, IReadOnlyList<string>? CorrectOptionIds,
        IReadOnlyList<string>? CorrectSequenceIds, bool? CorrectBooleanAnswer,
        IReadOnlyList<EducationOptionRequest>? MatchTargets, IReadOnlyList<ObjectiveQuestionMatch>? CorrectMatches,
        IReadOnlyList<string> AllowedTextAnswers, bool TrimTextAnswers, bool IgnoreCase,
        IReadOnlyList<decimal> AllowedNumericAnswers, decimal NumericTolerance);

    public static ObjectiveQuestionDefinition Definition(EducationQuestion question)
    {
        var key = JsonSerializer.Deserialize<StoredAnswerKey>(question.AnswerKeyJson)
            ?? throw new InvalidOperationException("Stored answer key is invalid.");
        var options = JsonSerializer.Deserialize<EducationOptionRequest[]>(question.OptionsJson) ?? [];
        try
        {
            return question.Type switch
            {
                ObjectiveQuestionTypeCodes.SingleChoice => ObjectiveQuestionDefinition.SingleChoice(question.MaxScore,
                    options.Select(x => new ObjectiveQuestionOption(x.Id, x.Label)), key.CorrectOptionId ?? string.Empty),
                ObjectiveQuestionTypeCodes.MultipleSelect => ObjectiveQuestionDefinition.MultipleSelect(question.MaxScore,
                    options.Select(x => new ObjectiveQuestionOption(x.Id, x.Label)), key.CorrectOptionIds ?? []),
                ObjectiveQuestionTypeCodes.Ordering => ObjectiveQuestionDefinition.Ordering(question.MaxScore,
                    options.Select(x => new ObjectiveQuestionOption(x.Id, x.Label)), key.CorrectSequenceIds ?? []),
                ObjectiveQuestionTypeCodes.Matching => ObjectiveQuestionDefinition.Matching(question.MaxScore,
                    options.Select(x => new ObjectiveQuestionOption(x.Id, x.Label)),
                    (key.MatchTargets ?? []).Select(x => new ObjectiveQuestionOption(x.Id, x.Label)),
                    key.CorrectMatches ?? []),
                ObjectiveQuestionTypeCodes.TrueFalse => ObjectiveQuestionDefinition.TrueFalse(question.MaxScore,
                    key.CorrectBooleanAnswer ?? throw new ArgumentException("True-false key is missing.")),
                ObjectiveQuestionTypeCodes.FillBlank when question.FillMode == FillBlankModeCodes.Text =>
                    ObjectiveQuestionDefinition.TextFillBlank(question.MaxScore, key.AllowedTextAnswers ?? [], key.TrimTextAnswers,
                        key.IgnoreCase ? TextAnswerCasePolicy.Insensitive : TextAnswerCasePolicy.Sensitive),
                ObjectiveQuestionTypeCodes.FillBlank when question.FillMode == FillBlankModeCodes.Number =>
                    ObjectiveQuestionDefinition.NumericFillBlank(question.MaxScore, key.AllowedNumericAnswers ?? [], key.NumericTolerance),
                _ => throw new ArgumentException("Unsupported question type.")
            };
        }
        catch (ArgumentException ex) { throw new InvalidOperationException("Stored question configuration is invalid.", ex); }
    }

    public static EducationStudentQuestionDto ToStudentQuestion(EducationQuestion question, bool includeExplanation = false)
        => EducationAuthoringMapper.ToStudentDto(question, includeExplanation);

    public static EducationAssessmentAttemptDto ToDto(EducationAssessmentAttempt attempt, EducationAssessment assessment)
    {
        var resultPublished = attempt.Recipient?.Assignment?.ResultsPublishedAt is not null;
        var canShowExplanations = attempt.Status == EducationAssessmentAttemptStatuses.Submitted && resultPublished;
        var manualGradingPending = attempt.Status == EducationAssessmentAttemptStatuses.Submitted && attempt.Score is null;
        var responses = attempt.Responses.Where(x => !x.IsDeleted)
            .Select(x => new EducationAttemptResponseDto(x.QuestionId,
                x.AnswerJson is null ? null : JsonSerializer.Deserialize<EducationAttemptAnswerDto>(x.AnswerJson),
                resultPublished ? x.Score : null, resultPublished ? x.Feedback : null))
            .ToArray();
        return new EducationAssessmentAttemptDto(attempt.Id, attempt.Recipient?.AssignmentId ?? string.Empty,
            attempt.Status, attempt.Version, attempt.StartedAt, attempt.ExpiresAt, attempt.SubmittedAt, resultPublished,
            resultPublished ? attempt.Recipient?.Assignment?.ResultsPublishedAt : null,
            resultPublished ? attempt.Score : null, resultPublished ? attempt.MaxScore : null,
            assessment.Questions.Where(x => !x.IsDeleted).OrderBy(x => x.Position)
                .Select(question => ToStudentQuestion(question, canShowExplanations)).ToArray(), responses,
            manualGradingPending, attempt.Recipient?.Assignment?.RetakeOfAssignmentId is null);
    }

    public static EducationAttemptSubmitDto ToSubmitDto(EducationAssessmentAttempt attempt)
    {
        var resultPublished = attempt.Recipient?.Assignment?.ResultsPublishedAt is not null;
        var manualGradingPending = attempt.Status == EducationAssessmentAttemptStatuses.Submitted && attempt.Score is null;
        return new(attempt.Id, attempt.Status, attempt.SubmittedAt, resultPublished,
            resultPublished ? attempt.Recipient?.Assignment?.ResultsPublishedAt : null,
            resultPublished ? attempt.Score : null, resultPublished ? attempt.MaxScore : null, manualGradingPending);
    }

    public static ObjectiveQuestionAnswerInput ParseAnswer(EducationAttemptAnswerInputDto? answer, EducationQuestion question)
    {
        if (answer is null) throw new ValidationAppException("An answer is required unless clearing the response.");
        if (question.Type == ObjectiveQuestionTypeCodes.WrittenResponse)
        {
            if (answer.Type != "written-response" || answer.TextValue is null || answer.TextValue.Length > 12000 ||
                answer.OptionId is not null || answer.OptionIds is not null || answer.OrderedOptionIds is not null ||
                answer.Matches is not null || answer.BooleanValue is not null || answer.NumericValue is not null ||
                answer.PhotoAttachmentId is not null || answer.AudioAttachmentId is not null)
                throw new ValidationAppException("Answer fields do not match the written-response question.");
            return ObjectiveQuestionAnswerInput.Text(answer.TextValue);
        }
        if (question.Type == ObjectiveQuestionTypeCodes.PhotoResponse)
        {
            if (answer.Type != "photo-response" || string.IsNullOrWhiteSpace(answer.PhotoAttachmentId) ||
                answer.PhotoAttachmentId.Length > 64 || answer.OptionId is not null || answer.OptionIds is not null ||
                answer.OrderedOptionIds is not null || answer.Matches is not null || answer.BooleanValue is not null ||
                answer.TextValue is not null || answer.NumericValue is not null || answer.AudioAttachmentId is not null)
                throw new ValidationAppException("Answer fields do not match the photo-response question.");
            return ObjectiveQuestionAnswerInput.Text(answer.PhotoAttachmentId);
        }
        if (question.Type == ObjectiveQuestionTypeCodes.VoiceResponse)
        {
            if (answer.Type != "voice-response" || string.IsNullOrWhiteSpace(answer.AudioAttachmentId) ||
                answer.AudioAttachmentId.Length > 64 || answer.OptionId is not null || answer.OptionIds is not null ||
                answer.OrderedOptionIds is not null || answer.Matches is not null || answer.BooleanValue is not null ||
                answer.TextValue is not null || answer.NumericValue is not null || answer.PhotoAttachmentId is not null)
                throw new ValidationAppException("Answer fields do not match the voice-response question.");
            return ObjectiveQuestionAnswerInput.Text(answer.AudioAttachmentId);
        }
        if (answer.PhotoAttachmentId is not null || answer.AudioAttachmentId is not null)
            throw new ValidationAppException("Media attachments are only valid for media-response questions.");
        try
        {
            var definition = Definition(question);
            var parsed = answer.Type switch
            {
                "single-choice" when answer.OptionId is not null && answer.BooleanValue is null && answer.TextValue is null && answer.NumericValue is null =>
                    ObjectiveQuestionAnswerInput.SingleChoice(answer.OptionId),
                "multiple-select" when answer.OptionIds is not null && answer.OptionId is null && answer.BooleanValue is null && answer.TextValue is null && answer.NumericValue is null =>
                    ObjectiveQuestionAnswerInput.MultipleSelect(answer.OptionIds),
                "ordering" when answer.OrderedOptionIds is not null && answer.OptionIds is null && answer.OptionId is null && answer.BooleanValue is null && answer.TextValue is null && answer.NumericValue is null =>
                    ObjectiveQuestionAnswerInput.Ordering(answer.OrderedOptionIds),
                "matching" when answer.Matches is not null && answer.OrderedOptionIds is null && answer.OptionIds is null && answer.OptionId is null && answer.BooleanValue is null && answer.TextValue is null && answer.NumericValue is null =>
                    ObjectiveQuestionAnswerInput.Matching(answer.Matches.Select(match => new ObjectiveQuestionMatch(match.LeftOptionId, match.MatchTargetId))),
                "true-false" when answer.BooleanValue is not null && answer.OptionId is null && answer.TextValue is null && answer.NumericValue is null =>
                    ObjectiveQuestionAnswerInput.TrueFalse(answer.BooleanValue.Value),
                "text" when answer.TextValue is not null && answer.OptionId is null && answer.BooleanValue is null && answer.NumericValue is null =>
                    ObjectiveQuestionAnswerInput.Text(answer.TextValue),
                "number" when answer.NumericValue is not null && answer.OptionId is null && answer.BooleanValue is null && answer.TextValue is null =>
                    ObjectiveQuestionAnswerInput.Number(answer.NumericValue),
                _ => throw new ValidationAppException("Answer fields do not match the declared answer type.")
            };
            if (answer.Type switch
                {
                    "single-choice" => question.Type != ObjectiveQuestionTypeCodes.SingleChoice,
                    "multiple-select" => question.Type != ObjectiveQuestionTypeCodes.MultipleSelect,
                    "ordering" => question.Type != ObjectiveQuestionTypeCodes.Ordering,
                    "matching" => question.Type != ObjectiveQuestionTypeCodes.Matching,
                    "true-false" => question.Type != ObjectiveQuestionTypeCodes.TrueFalse,
                    "text" => question.Type != ObjectiveQuestionTypeCodes.FillBlank || question.FillMode != FillBlankModeCodes.Text,
                    "number" => question.Type != ObjectiveQuestionTypeCodes.FillBlank || question.FillMode != FillBlankModeCodes.Number,
                    "written-response" => question.Type != ObjectiveQuestionTypeCodes.WrittenResponse,
                    _ => true
                })
                throw new ValidationAppException("Answer type does not match the question.");
            _ = ObjectiveQuestionScorer.Grade(definition, parsed);
            return parsed;
        }
        catch (ArgumentException ex) { throw new ValidationAppException(ex.Message); }
    }

    public static ObjectiveQuestionAnswerInput DeserializeAnswer(string answerJson, EducationQuestion question)
    {
        EducationAttemptAnswerInputDto? answer;
        try { answer = JsonSerializer.Deserialize<EducationAttemptAnswerInputDto>(answerJson); }
        catch (JsonException ex) { throw new ValidationAppException($"Saved answer is invalid: {ex.Message}"); }
        return ParseAnswer(answer, question);
    }
}
