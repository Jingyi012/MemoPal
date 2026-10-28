using MemoPal.Application.Features.Education.Attempts;
using MemoPal.Application.Features.Education.GuidedLearning.DTOs;
using MemoPal.Domain.Entities;

namespace MemoPal.Application.Features.Education.GuidedLearning;

internal static class EducationGuidedLearningMapper
{
    public static EducationGuidedLearningSessionDto ToSessionDto(
        EducationGuidedLearningContent content,
        EducationGuidedLearningSession session,
        IEnumerable<EducationGuidedLearningQuestionProgress> progress)
    {
        var byId = progress.ToDictionary(item => item.QuestionId, StringComparer.Ordinal);
        var questionsById = content.Questions.ToDictionary(item => item.Id, StringComparer.Ordinal);
        var order = EducationGuidedLearningContentReader.ReadQuestionOrder(session);
        var questions = order.Select((id, position) =>
        {
            var question = questionsById[id];
            var state = byId[id];
            return new EducationGuidedLearningQuestionDto(
                EducationAttemptMapping.ToStudentQuestion(question),
                content.ObjectiveTitles.GetValueOrDefault(question.ObjectiveId) ?? "Learning objective",
                ToProgressDto(state));
        }).ToArray();
        var nextQuestionId = questions.FirstOrDefault(item => item.Progress.AttemptCount == 0)?.Question.Id
            ?? questions.FirstOrDefault(item => item.Progress.LatestCorrect == false)?.Question.Id;
        return new(session.Id, session.CourseId, content.Course.Title, session.AssessmentId,
            content.Assessment.Title, session.AssessmentVersion, session.Version, session.StartedAtUtc,
            session.CompletedAtUtc, session.CompletedAtUtc is not null, questions, nextQuestionId);
    }

    public static EducationGuidedLearningQuestionProgressDto ToProgressDto(EducationGuidedLearningQuestionProgress progress) =>
        new(progress.QuestionId, progress.Position, progress.AttemptCount, progress.FirstTryCorrect,
            progress.Missed, progress.Solved, progress.LatestCorrect);

    public static EducationGuidedLearningCheckDto ToCheckDto(
        EducationGuidedLearningSession session,
        EducationGuidedLearningQuestionProgress progress,
        EducationQuestion question,
        bool isCorrect,
        IEnumerable<EducationGuidedLearningQuestionProgress> allProgress,
        bool replayed = false)
    {
        var order = EducationGuidedLearningContentReader.ReadQuestionOrder(session);
        var nextQuestionId = order.FirstOrDefault(id => allProgress.Single(item => item.QuestionId == id).AttemptCount == 0)
            ?? order.FirstOrDefault(id => allProgress.Single(item => item.QuestionId == id).LatestCorrect == false);
        return new(session.Id, question.Id, isCorrect, question.Explanation, session.Version,
            session.CompletedAtUtc is not null, ToProgressDto(progress), nextQuestionId, replayed,
            EducationAttemptMapping.CorrectAnswer(question));
    }

    public static EducationGuidedLessonProgressDto ToLessonProgressDto(
        EducationAssessment assessment,
        EducationQuestion[] questions,
        IReadOnlyList<EducationGuidedObjectiveSummaryDto> objectives,
        EducationGuidedLearningSession? session,
        IReadOnlyCollection<EducationGuidedLearningQuestionProgress> progress)
    {
        var attempted = progress.Count(item => item.AttemptCount > 0);
        var solved = progress.Count(item => item.Solved);
        var latestIncorrect = progress.Count(item => item.LatestCorrect == false);
        var isComplete = session?.CompletedAtUtc is not null;
        return new(assessment.Id, assessment.Title, objectives, assessment.Version,
            questions.Length, attempted, solved, questions.Length - solved, latestIncorrect, session is not null, isComplete,
            session?.Id, session?.Version, session?.CompletedAtUtc);
    }
}
