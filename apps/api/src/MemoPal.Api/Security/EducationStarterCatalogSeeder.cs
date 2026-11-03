using MemoPal.Application.Features.Education.Authoring;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using MemoPal.Domain.Entities;
using MemoPal.Domain.Education;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace MemoPal.Api.Security;

/// <summary>Creates immutable, source-owned starter courses. Existing IDs are never resurrected or overwritten.</summary>
public sealed class EducationStarterCatalogSeeder(AppDbContext db)
{
    private const string SystemOwnerId = "system";
    private const long AdvisoryLockId = 726348192;
    private static readonly SemaphoreSlim ProcessGate = new(1, 1);

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        // Relational hosts coordinate through the transaction-scoped database lock below.
        // Keep the process gate only for non-relational providers that lack that primitive.
        if (!db.Database.IsRelational())
        {
            await ProcessGate.WaitAsync(cancellationToken);
            try
            {
                await SeedCoreAsync(cancellationToken);
            }
            finally
            {
                ProcessGate.Release();
            }
            return;
        }

        await SeedCoreAsync(cancellationToken);
    }

    private async Task SeedCoreAsync(CancellationToken cancellationToken)
    {
        var strategy = db.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            db.ChangeTracker.Clear();
            await using var transaction = db.Database.IsRelational()
                ? await db.Database.BeginTransactionAsync(cancellationToken)
                : null;
            try
            {
                if (db.Database.ProviderName == "Npgsql.EntityFrameworkCore.PostgreSQL")
                    await db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock({AdvisoryLockId})", cancellationToken);

                foreach (var definition in EducationStarterCatalogContent.All)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    if (await db.EducationCourses.IgnoreQueryFilters().AnyAsync(course => course.Id == definition.CourseId, cancellationToken))
                        continue;

                    var objectiveId = $"{definition.CourseId}-objective-v1";
                    var assessmentId = $"{definition.CourseId}-lesson-v1";
                    if (await db.EducationObjectives.IgnoreQueryFilters().AnyAsync(item => item.Id == objectiveId, cancellationToken) ||
                        await db.EducationAssessments.IgnoreQueryFilters().AnyAsync(item => item.Id == assessmentId, cancellationToken))
                        continue;

                    db.EducationCourses.Add(CreateCourse(definition, objectiveId, assessmentId));
                }

                await EducationStarterUnitCatalog.AddMissingAsync(db, cancellationToken);
                await db.SaveChangesAsync(cancellationToken);
                if (transaction is not null) await transaction.CommitAsync(cancellationToken);
            }
            catch
            {
                if (transaction is not null) await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }

    private static EducationCourse CreateCourse(EducationStarterCourseSeed definition, string objectiveId,
        string assessmentId)
    {
        var now = DateTime.UtcNow;
        var course = new EducationCourse
        {
            Id = definition.CourseId,
            UserId = SystemOwnerId,
            Title = definition.Title,
            CreatedAt = now,
            UpdatedAt = now,
            CreatedBy = SystemOwnerId,
            UpdatedBy = SystemOwnerId
        };
        course.ConfirmNotConfidentialExamContent(SystemOwnerId, now);
        course.SetPublic(true, now);

        var objective = new EducationObjective
        {
            Id = objectiveId,
            CourseId = course.Id,
            Title = definition.ObjectiveTitle,
            MemoryContentType = EducationMemoryContentType.ConceptUnderstanding,
            LanguageCode = "zh-Hans",
            ContentOrigin = EducationContentOrigin.Original,
            ReviewStatus = EducationContentReviewStatus.Unreviewed,
            CreatedAt = now,
            UpdatedAt = now,
            CreatedBy = SystemOwnerId,
            UpdatedBy = SystemOwnerId
        };
        for (var index = 0; index < definition.TeachingItems.Count; index++)
        {
            var item = definition.TeachingItems[index];
            var studyItem = new EducationObjectiveStudyItem
            {
                Id = $"{objectiveId}-item-{index + 1:D2}",
                ObjectiveId = objectiveId,
                StableKey = $"v1-item-{index + 1:D2}",
                Position = index + 1,
                Kind = EducationMemoryContentType.ConceptUnderstanding,
                Primary = item.Primary,
                Secondary = item.Secondary,
                Status = EducationStudyItemStatus.Published,
                CreatedAt = now,
                UpdatedAt = now,
                CreatedBy = SystemOwnerId,
                UpdatedBy = SystemOwnerId
            };
            studyItem.SetPublished(true, SystemOwnerId, now);
            objective.StudyItems.Add(studyItem);
        }

        var assessment = new EducationAssessment
        {
            Id = assessmentId,
            CourseId = course.Id,
            UserId = SystemOwnerId,
            Title = definition.LessonTitle,
            CreatedAt = now,
            UpdatedAt = now,
            CreatedBy = SystemOwnerId,
            UpdatedBy = SystemOwnerId
        };
        for (var index = 0; index < definition.Questions.Count; index++)
        {
            var request = definition.Questions[index];
            var question = EducationQuestionSeedFactory.Create(request with { ObjectiveId = objectiveId }, assessment.Id, index + 1);
            question.Id = $"{assessment.Id}-q{index + 1:D2}";
            assessment.Questions.Add(question);
        }
        assessment.Publish(now, isPublicPractice: true);
        course.Objectives.Add(objective);
        course.Assessments.Add(assessment);
        return course;
    }
}

internal sealed record EducationStarterCourseSeed(string CourseId, string Title, string ObjectiveTitle,
    string LessonTitle, IReadOnlyList<EducationStarterTeachingItemSeed> TeachingItems,
    IReadOnlyList<EducationQuestionRequest> Questions);

internal sealed record EducationStarterTeachingItemSeed(string Primary, string Secondary);

internal static class EducationStarterCatalogContent
{
    public static IReadOnlyList<EducationStarterCourseSeed> All { get; } = Load();

    private static IReadOnlyList<EducationStarterCourseSeed> Load()
    {
        using var stream = typeof(EducationStarterCatalogContent).Assembly.GetManifestResourceStream(
            "MemoPal.Api.Security.EducationStarterCatalog.v1.json")
            ?? throw new InvalidOperationException("Starter course manifest is missing.");
        return JsonSerializer.Deserialize<IReadOnlyList<EducationStarterCourseSeed>>(stream,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? throw new InvalidOperationException("Starter course manifest is invalid.");
    }
}
