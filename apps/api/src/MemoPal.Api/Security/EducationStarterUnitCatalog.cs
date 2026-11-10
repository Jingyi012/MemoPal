using System.Text.Json;
using System.Text.Json.Serialization;
using MemoPal.Application.Features.Education.Authoring;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Api.Security;

/// <summary>Runs inside the starter seeder's existing transaction and host lock.</summary>
internal static class EducationStarterUnitCatalog
{
    private static readonly IReadOnlyList<StarterUnit> Units = Load();

    public static async Task AddMissingAsync(AppDbContext db, CancellationToken ct)
    {
        foreach (var seed in Units)
        {
            // Never restore a withdrawn course or overwrite an administrator's edits.
            if (await db.EducationCourses.IgnoreQueryFilters().AnyAsync(x => x.Id == seed.Id, ct)) continue;
            var objectiveIds = seed.Objectives.Select(x => $"{seed.Id}-{x.Key}").ToArray();
            var assessmentIds = seed.Lessons.Select(x => $"{seed.Id}-{x.Key}").ToArray();
            var unitId = $"{seed.Id}-unit";
            if (await db.EducationObjectives.IgnoreQueryFilters().AnyAsync(x => objectiveIds.Contains(x.Id), ct)
                || await db.EducationAssessments.IgnoreQueryFilters().AnyAsync(x => assessmentIds.Contains(x.Id), ct)
                || await db.EducationCourseUnits.IgnoreQueryFilters().AnyAsync(x => x.Id == unitId, ct)) continue;
            var now = DateTime.UtcNow;
            var course = new EducationCourse { Id = seed.Id, UserId = "system", Title = seed.Title,
                SubjectCode = seed.Subject, LearningStage = seed.Stage, LanguageCode = seed.Language,
                OutlineVersion = 1, CreatedBy = "system", UpdatedBy = "system" };
            course.ConfirmNotConfidentialExamContent("system", now);
            course.SetPublic(true, now);
            db.EducationCourses.Add(course);
            db.EducationCourseUnits.Add(new EducationCourseUnit { Id = unitId, CourseId = course.Id,
                Title = seed.UnitTitle, Position = 0, CreatedBy = "system", UpdatedBy = "system" });
            for (var index = 0; index < seed.Objectives.Count; index++)
            {
                var definition = seed.Objectives[index];
                var objective = new EducationObjective { Id = objectiveIds[index], CourseId = course.Id,
                    UnitId = unitId, UnitPosition = index, Title = definition.Title,
                    MemoryContentType = seed.Kind,
                    LanguageCode = seed.Language, SubjectCode = seed.Subject,
                    ContentOrigin = EducationContentOrigin.Original, ReviewStatus = EducationContentReviewStatus.Unreviewed,
                    CreatedBy = "system", UpdatedBy = "system" };
                for (var itemIndex = 0; itemIndex < definition.Items.Count; itemIndex++)
                {
                    var item = definition.Items[itemIndex];
                    if (item.IllustrationCode is not null && EducationStudyIllustrations.FromMediaReference($"media:learning-{item.IllustrationCode}") != item.IllustrationCode)
                        throw new InvalidOperationException("Starter item has an unknown illustration.");
                    var study = new EducationObjectiveStudyItem { Id = $"{objective.Id}-i{itemIndex + 1}",
                        ObjectiveId = objective.Id, StableKey = $"item-{itemIndex + 1}", Position = itemIndex + 1,
                        Kind = seed.Kind, Primary = item.Primary,
                        Secondary = item.Secondary, Phonetic = item.Phonetic, Extra = item.Extra,
                        MediaRef = item.IllustrationCode is null ? null : $"media:learning-{item.IllustrationCode}",
                        LanguageCode = seed.Language, CreatedBy = "system", UpdatedBy = "system" };
                    study.SetPublished(true, "system", now);
                    objective.StudyItems.Add(study);
                }
                course.Objectives.Add(objective);
            }
            for (var index = 0; index < seed.Lessons.Count; index++)
            {
                var definition = seed.Lessons[index];
                var assessment = new EducationAssessment { Id = assessmentIds[index], CourseId = course.Id,
                    UserId = "system", Title = definition.Title, CreatedBy = "system", UpdatedBy = "system" };
                for (var questionIndex = 0; questionIndex < definition.Questions.Count; questionIndex++)
                {
                    var request = definition.Questions[questionIndex];
                    var objectiveId = $"{seed.Id}-{request.ObjectiveId}";
                    if (!objectiveIds.Contains(objectiveId)) throw new InvalidOperationException("Starter unit has an invalid objective reference.");
                    var question = EducationQuestionSeedFactory.Create(request with { ObjectiveId = objectiveId }, assessment.Id, questionIndex + 1);
                    question.Id = $"{assessment.Id}-q{questionIndex + 1}";
                    assessment.Questions.Add(question);
                }
                // Preserve authored lesson order when several lessons share the final objective.
                assessment.Publish(now.AddMilliseconds(index - seed.Lessons.Count), isPublicPractice: true);
                course.Assessments.Add(assessment);
            }
        }
    }

    private static IReadOnlyList<StarterUnit> Load()
    {
        using var stream = typeof(EducationStarterUnitCatalog).Assembly.GetManifestResourceStream("MemoPal.Api.Security.EducationStarterUnits.v1.json")
            ?? throw new InvalidOperationException("Starter unit manifest is missing.");
        return JsonSerializer.Deserialize<IReadOnlyList<StarterUnit>>(stream, new JsonSerializerOptions {
            PropertyNameCaseInsensitive = true, Converters = { new JsonStringEnumConverter() } })
            ?? throw new InvalidOperationException("Starter unit manifest is invalid.");
    }

    private sealed record StarterUnit(string Id, string Title, string Subject, string Stage, string Language,
        string UnitTitle, IReadOnlyList<StarterObjective> Objectives, IReadOnlyList<StarterLesson> Lessons,
        EducationMemoryContentType Kind = EducationMemoryContentType.LanguageItem);
    private sealed record StarterObjective(string Key, string Title, IReadOnlyList<StarterItem> Items);
    private sealed record StarterItem(string Primary, string Secondary, string? Phonetic, string? Extra, string? IllustrationCode = null);
    private sealed record StarterLesson(string Key, string Title, IReadOnlyList<EducationQuestionRequest> Questions);
}
