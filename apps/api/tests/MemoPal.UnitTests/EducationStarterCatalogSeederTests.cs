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
        var courses = await verify.EducationCourses.AsNoTracking().ToListAsync();
        var assessments = await verify.EducationAssessments.AsNoTracking().Include(x => x.Questions).ToListAsync();
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
        Assert.Equal(3, await verify.EducationCourses.CountAsync());
        Assert.Equal(18, await verify.EducationQuestions.CountAsync());
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
        // The catalog intentionally includes two other active starters; this course remains withdrawn.
        Assert.Equal(2, await db.EducationCourses.CountAsync(x => !x.IsDeleted));
        Assert.Equal(3, await db.EducationCourses.IgnoreQueryFilters().CountAsync());
    }

    private static AppDbContext CreateContext(string name,
        Microsoft.EntityFrameworkCore.Storage.InMemoryDatabaseRoot root) =>
        new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(name, root).Options);
}
