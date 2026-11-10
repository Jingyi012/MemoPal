using MemoPal.Api.Security;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.UnitTests;

public sealed class EducationStarterCatalogSeederTests
{
    [Fact]
    public async Task SeedsThreePublishedCoursesAndIsIdempotentAcrossConcurrentHostsInOneProcess()
    {
        var name = $"starter-catalog-{Guid.NewGuid():N}";
        var root = new Microsoft.EntityFrameworkCore.Storage.InMemoryDatabaseRoot();
        await using var first = CreateContext(name, root);
        await first.Database.EnsureCreatedAsync();
        await using var second = CreateContext(name, root);

        await Task.WhenAll(
            new EducationStarterCatalogSeeder(first).SeedAsync(),
            new EducationStarterCatalogSeeder(second).SeedAsync());

        await using var verify = CreateContext(name, root);
        var courses = await verify.EducationCourses.AsNoTracking().Where(x => x.Id.StartsWith("system-starter-")).ToListAsync();
        var assessments = await verify.EducationAssessments.AsNoTracking().Where(x => x.CourseId.StartsWith("system-starter-")).Include(x => x.Questions).ToListAsync();
        Assert.Equal(3, courses.Count);
        Assert.All(courses, course =>
        {
            Assert.Equal("system", course.UserId);
            Assert.Equal("system", course.CreatedBy);
            Assert.True(course.IsPublic);
        });
        Assert.Equal(3, assessments.Count);
        Assert.All(assessments, assessment =>
        {
            Assert.Equal(EducationAssessmentStatuses.Published, assessment.Status);
            Assert.True(assessment.IsPublicPractice);
            Assert.Equal(6, assessment.Questions.Count);
        });

        await new EducationStarterCatalogSeeder(verify).SeedAsync();
        Assert.Equal(9, await verify.EducationCourses.CountAsync());
        Assert.Equal(90, await verify.EducationQuestions.CountAsync());
    }

    [Fact]
    public async Task ExistingDeletedOrHiddenSeedCourseIsNotResurrectedOrFilledIn()
    {
        const string seedCourseId = "system-starter-english-requests-v1";
        var options = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase($"starter-course-withdrawn-{Guid.NewGuid():N}").Options;
        await using var db = new AppDbContext(options);
        db.EducationCourses.Add(new EducationCourse
        {
            Id = seedCourseId,
            UserId = "system",
            Title = "Withdrawn starter",
            IsDeleted = true,
            CreatedBy = "system",
            UpdatedBy = "system"
        });
        db.EducationCourses.Local.Single().SetModerationHidden(true, "withdrawn seed", DateTime.UtcNow);
        await db.SaveChangesAsync();

        await new EducationStarterCatalogSeeder(db).SeedAsync();

        var existing = await db.EducationCourses.IgnoreQueryFilters().SingleAsync(x => x.Id == seedCourseId);
        Assert.True(existing.IsDeleted);
        Assert.True(existing.IsModerationHidden);
        Assert.Equal("Withdrawn starter", existing.Title);
        Assert.Empty(await db.EducationAssessments.Where(x => x.CourseId == seedCourseId).ToListAsync());
        // The other legacy starters and six new units remain available.
        Assert.Equal(8, await db.EducationCourses.CountAsync(x => !x.IsDeleted));
        Assert.Equal(9, await db.EducationCourses.IgnoreQueryFilters().CountAsync());
    }

    [Fact]
    public async Task Campus_unit_has_ordered_teaching_and_three_lessons_before_unaided_challenge()
    {
        var root = new Microsoft.EntityFrameworkCore.Storage.InMemoryDatabaseRoot();
        await using var db = CreateContext($"campus-{Guid.NewGuid():N}", root);
        await new EducationStarterCatalogSeeder(db).SeedAsync();
        const string id = "system-learn-campus-v1";
        var course = await db.EducationCourses.SingleAsync(x => x.Id == id);
        Assert.Equal("chinese", course.SubjectCode);
        Assert.Equal("early-primary", course.LearningStage);
        Assert.Equal("zh-Hans", course.LanguageCode);
        var unit = await db.EducationCourseUnits.SingleAsync(x => x.CourseId == id);
        var objectives = await db.EducationObjectives.Include(x => x.StudyItems)
            .Where(x => x.CourseId == id).OrderBy(x => x.UnitPosition).ToListAsync();
        Assert.Equal(3, objectives.Count);
        Assert.All(objectives, objective => {
            Assert.Equal(unit.Id, objective.UnitId);
            Assert.Equal(3, objective.StudyItems.Count);
            Assert.All(objective.StudyItems, item => Assert.False(string.IsNullOrWhiteSpace(item.Phonetic)));
        });
        var lessons = await db.EducationAssessments.Include(x => x.Questions).Where(x => x.CourseId == id)
            .OrderBy(x => x.PublishedAt).ToListAsync();
        Assert.Equal(4, lessons.Count);
        Assert.EndsWith("challenge", lessons[^1].Id);
        Assert.All(lessons[^1].Questions, question => Assert.Equal("fill-blank", question.Type));
        course.Title = "Edited by an administrator";
        course.SetPublic(false, DateTime.UtcNow);
        await db.SaveChangesAsync();
        await new EducationStarterCatalogSeeder(db).SeedAsync();
        var preserved = await db.EducationCourses.SingleAsync(x => x.Id == id);
        Assert.Equal("Edited by an administrator", preserved.Title);
        Assert.False(preserved.IsPublic);
        Assert.Equal(1, await db.EducationCourseUnits.CountAsync(x => x.CourseId == id));
    }

    [Fact]
    public async Task Six_starter_units_have_teaching_paths_and_separate_challenges()
    {
        var root = new Microsoft.EntityFrameworkCore.Storage.InMemoryDatabaseRoot();
        await using var db = CreateContext($"six-units-{Guid.NewGuid():N}", root);
        await new EducationStarterCatalogSeeder(db).SeedAsync();
        var courses = await db.EducationCourses.Where(x => x.Id.StartsWith("system-learn-")).ToListAsync();
        Assert.Equal(6, courses.Count);
        Assert.Equal(2, courses.Count(x => x.SubjectCode == "chinese"));
        Assert.Equal(2, courses.Count(x => x.SubjectCode == "english"));
        Assert.Equal(2, courses.Count(x => x.SubjectCode == "math"));
        foreach (var course in courses)
        {
            var unit = await db.EducationCourseUnits.SingleAsync(x => x.CourseId == course.Id);
            var objectives = await db.EducationObjectives.Include(x => x.StudyItems).Where(x => x.CourseId == course.Id).ToListAsync();
            Assert.Equal(3, objectives.Count);
            Assert.All(objectives, objective => {
                Assert.Equal(unit.Id, objective.UnitId);
                Assert.Equal(3, objective.StudyItems.Count);
                Assert.All(objective.StudyItems, item => {
                    Assert.Equal(course.LanguageCode, item.LanguageCode);
                    Assert.False(string.IsNullOrWhiteSpace(item.Primary));
                    Assert.False(string.IsNullOrWhiteSpace(item.Secondary));
                });
            });
            var lessons = await db.EducationAssessments.Include(x => x.Questions).Where(x => x.CourseId == course.Id).OrderBy(x => x.PublishedAt).ToListAsync();
            Assert.Equal(4, lessons.Count);
            Assert.EndsWith("challenge", lessons[^1].Id);
            Assert.All(lessons, lesson => {
                Assert.True(lesson.IsPublicPractice);
                Assert.Equal(3, lesson.Questions.Count);
                Assert.All(lesson.Questions, question => Assert.Contains(question.ObjectiveId, objectives.Select(x => x.Id)));
            });
            Assert.All(lessons[^1].Questions, question => Assert.Equal("fill-blank", question.Type));
        }
    }

    private static AppDbContext CreateContext(string name,
        Microsoft.EntityFrameworkCore.Storage.InMemoryDatabaseRoot root) =>
        new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(name, root).Options);
}
