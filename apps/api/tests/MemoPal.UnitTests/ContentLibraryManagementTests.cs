using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Features.PredefinedMemoryLessons.Commands;
using MemoPal.Application.Features.PredefinedMemoryLessons.DTOs;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.UnitTests;

public sealed class ContentLibraryManagementTests
{
    private static AppDbContext CreateDb() => new(new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private static async Task<(PredefinedMemoryLesson Lesson, PredefinedMemoryCollection Source, PredefinedMemoryCollection Target)> Seed(AppDbContext db)
    {
        var category = new PredefinedMemoryLessonCategory { Key = "test", NameEn = "Test", NameZh = "测试", IsActive = true };
        var lesson = new PredefinedMemoryLesson { Key = "lesson", TitleEn = "Lesson", TitleZh = "课程", Category = category,
            CategoryId = category.Id, Items = [new() { Position = 1, ContentEn = "Spring", ContentZh = "春" }] };
        var source = new PredefinedMemoryCollection { TitleEn = "Source", Category = category, CategoryId = category.Id };
        var target = new PredefinedMemoryCollection { TitleEn = "Target", Category = category, CategoryId = category.Id };
        source.Lessons.Add(new() { Lesson = lesson, LessonId = lesson.Id, CollectionId = source.Id, Position = 1 });
        db.PredefinedMemoryCollections.AddRange(source, target);
        await db.SaveChangesAsync();
        return (lesson, source, target);
    }

    [Fact]
    public async Task MoveUpdatesBothCollectionsAndPreservesOtherMemberships()
    {
        await using var db = CreateDb();
        var (lesson, source, target) = await Seed(db);
        var other = new PredefinedMemoryCollection { CategoryId = source.CategoryId, Category = source.Category };
        other.Lessons.Add(new() { Lesson = lesson, LessonId = lesson.Id, CollectionId = other.Id, Position = 1 });
        db.PredefinedMemoryCollections.Add(other);
        await db.SaveChangesAsync();
        await new MoveCollectionLessonCommandHandler(db).Handle(new(lesson.Id, new(source.Id, target.Id, 1, 1, 1)), default);
        Assert.Empty(source.Lessons);
        Assert.Equal(lesson.Id, Assert.Single(target.Lessons).LessonId);
        Assert.Single(other.Lessons);
        Assert.Equal(2, source.Version);
        Assert.Equal(2, target.Version);
        Assert.Equal(2, lesson.Version);
        Assert.Equal(1, other.Version);
    }

    [Theory]
    [InlineData("stale-source")]
    [InlineData("stale-target")]
    [InlineData("stale-lesson")]
    [InlineData("published-target")]
    [InlineData("published-last-source")]
    [InlineData("wrong-source")]
    [InlineData("missing-target")]
    [InlineData("same-target")]
    public async Task InvalidMoveDoesNotChangeEitherCollection(string scenario)
    {
        await using var db = CreateDb();
        var (lesson, source, target) = await Seed(db);
        if (scenario == "published-target") target.IsPublished = true;
        if (scenario == "published-last-source") source.IsPublished = true;
        await db.SaveChangesAsync();
        var request = new MoveCollectionLessonRequest(scenario == "wrong-source" ? null : source.Id,
            scenario == "missing-target" ? "missing" : scenario == "same-target" ? source.Id : target.Id,
            scenario == "stale-source" ? 0 : 1, scenario == "stale-target" ? 0 : 1, scenario == "stale-lesson" ? 0 : 1);
        var error = await Record.ExceptionAsync(() => new MoveCollectionLessonCommandHandler(db).Handle(new(lesson.Id, request), default));
        Assert.NotNull(error);
        Assert.True(error is ConflictAppException or ValidationAppException or NotFoundAppException);
        db.ChangeTracker.Clear();
        Assert.Single((await db.PredefinedMemoryCollections.Include(x => x.Lessons).SingleAsync(x => x.Id == source.Id)).Lessons);
        Assert.Empty((await db.PredefinedMemoryCollections.Include(x => x.Lessons).SingleAsync(x => x.Id == target.Id)).Lessons);
    }

    [Fact]
    public async Task MoveToUnassignedThenIntoACollection()
    {
        await using var db = CreateDb();
        var (lesson, source, target) = await Seed(db);
        var handler = new MoveCollectionLessonCommandHandler(db);
        await handler.Handle(new(lesson.Id, new(source.Id, null, 1, null, 1)), default);
        Assert.Empty(source.Lessons);
        await handler.Handle(new(lesson.Id, new(null, target.Id, null, 1, 2)), default);
        Assert.Single(target.Lessons);
    }

    [Fact]
    public async Task DeleteCollectionChecksVersionAndKeepsLessons()
    {
        await using var db = CreateDb();
        var (lesson, source, _) = await Seed(db);
        var handler = new DeleteMemoryCollectionCommandHandler(db);
        await Assert.ThrowsAsync<ConflictAppException>(() => handler.Handle(new(source.Id, 0), default));
        await handler.Handle(new(source.Id, 1), default);
        Assert.True(source.IsDeleted);
        Assert.False(lesson.IsDeleted);
        Assert.Single(await db.PredefinedMemoryLessons.ToListAsync());
    }

    [Fact]
    public async Task DeletingLastLessonUnpublishesEmptyCollection()
    {
        await using var db = CreateDb();
        var (lesson, source, _) = await Seed(db);
        source.IsPublished = true;
        await db.SaveChangesAsync();
        await new DeletePredefinedMemoryLessonCommandHandler(db).Handle(new(lesson.Id), default);
        Assert.True(lesson.IsDeleted);
        Assert.False(source.IsPublished);
        Assert.Empty(source.Lessons);
        Assert.Equal(2, source.Version);
    }

    [Fact]
    public async Task CreateInCollectionIsAtomicAndRejectsStaleCollection()
    {
        await using var db = CreateDb();
        var (_, _, target) = await Seed(db);
        var input = new PredefinedMemoryLessonUpsertRequest { Key = "new-lesson", TitleEn = "New", TitleZh = "新",
            Emoji = "📚", CategoryId = target.CategoryId, CollectionId = target.Id, ExpectedCollectionVersion = 0,
            Items = [new() { Position = 1, ContentEn = "One", ContentZh = "一" }] };
        var handler = new CreatePredefinedMemoryLessonCommandHandler(db);
        await Assert.ThrowsAsync<ConflictAppException>(() => handler.Handle(new(input), default));
        Assert.Equal(1, await db.PredefinedMemoryLessons.CountAsync());
        input.ExpectedCollectionVersion = 1;
        var result = (await handler.Handle(new(input), default)).Data!;
        Assert.Equal(result.Id, Assert.Single(target.Lessons).LessonId);
        Assert.Equal(2, target.Version);
    }

    [Fact]
    public async Task ConcurrentLessonWriteIsRejectedByPersistence()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        await using var first = new AppDbContext(options);
        var (lesson, _, _) = await Seed(first);
        await using var second = new AppDbContext(options);
        var stale = await second.PredefinedMemoryLessons.SingleAsync(x => x.Id == lesson.Id);
        lesson.Version++;
        await first.SaveChangesAsync();
        stale.Version++;
        stale.TitleEn = "Stale edit";
        await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() => second.SaveChangesAsync());
    }

}
