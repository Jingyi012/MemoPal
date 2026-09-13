using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Features.PredefinedMemoryLessons.Commands;
using MemoPal.Application.Features.PredefinedMemoryLessons.DTOs;
using MemoPal.Application.Features.PredefinedMemoryLessons.Queries;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.UnitTests;

public sealed class MemoryCollectionTests
{
    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task ConcurrentDownloadReturnsCommittedCopyButDoesNotHideUnrelatedSaveFailures(bool competingDownload)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        await using var winner = new AppDbContext(options);
        var collection = await SeedCollection(winner);
        string? winnerFolderId = null;
        await using var loser = new FailingSaveContext(options, async () =>
        {
            if (competingDownload)
                winnerFolderId = (await new DownloadMemoryCollectionCommandHandler(winner)
                    .Handle(new("user-a", collection.Id, "zh"), default)).Data!.FolderId;
        });
        var operation = new DownloadMemoryCollectionCommandHandler(loser).Handle(new("user-a", collection.Id, "zh"), default);
        if (competingDownload)
        {
            var result = (await operation).Data!;
            Assert.True(result.AlreadyDownloaded);
            Assert.Equal(winnerFolderId, result.FolderId);
            Assert.Equal(10, result.MemorySetCount);
            Assert.Single(await winner.MemoryFolders.ToListAsync());
            Assert.Equal(10, await winner.MemorySets.CountAsync());
        }
        else
        {
            await Assert.ThrowsAsync<DbUpdateException>(() => operation);
            Assert.Empty(await winner.MemoryFolders.ToListAsync());
            Assert.Empty(await winner.MemorySets.ToListAsync());
        }
    }

    private sealed class FailingSaveContext(DbContextOptions<AppDbContext> options, Func<Task> beforeFailure)
        : AppDbContext(options)
    {
        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            await beforeFailure();
            throw new DbUpdateException("Simulated rejected transaction.");
        }
    }

    [Fact]
    public async Task DownloadCopiesTenLessonsIntoOwnedFolderAndDoesNotOverwriteOnRepeat()
    {
        await using var db = CreateDb();
        var collection = await SeedCollection(db);
        var handler = new DownloadMemoryCollectionCommandHandler(db);
        var result = (await handler.Handle(new("user-a", collection.Id, "zh"), default)).Data!;
        var sets = await db.MemorySets.Include(x => x.Items).Where(x => x.MemoryFolderId == result.FolderId).ToListAsync();
        Assert.Equal(10, sets.Count);
        Assert.All(sets, x => { Assert.Equal("user-a", x.UserId); Assert.Equal("draft", x.Status); Assert.Equal("private", x.Visibility); Assert.Single(x.Items); });
        Assert.Equal("中文听写集1", (await db.MemoryFolders.SingleAsync()).Name);
        sets[0].Title = "My edits";
        await db.SaveChangesAsync();
        var repeated = (await handler.Handle(new("user-a", collection.Id, "zh"), default)).Data!;
        Assert.True(repeated.AlreadyDownloaded);
        Assert.Equal(result.FolderId, repeated.FolderId);
        Assert.Equal(10, await db.MemorySets.CountAsync());
        Assert.Equal("My edits", sets[0].Title);
        var otherUser = (await handler.Handle(new("user-b", collection.Id, "en"), default)).Data!;
        Assert.NotEqual(result.FolderId, otherUser.FolderId);
        Assert.Equal(10, await db.MemorySets.CountAsync(x => x.UserId == "user-b"));
        Assert.Equal(10, await db.PredefinedMemoryLessons.CountAsync());
    }

    [Fact]
    public async Task UnpublishedCollectionIsNeitherListedNorDownloadable()
    {
        await using var db = CreateDb();
        var collection = await SeedCollection(db);
        collection.IsPublished = false;
        await db.SaveChangesAsync();
        Assert.Empty((await new GetMemoryCollectionsQueryHandler(db).Handle(new(true), default)).Data!);
        await Assert.ThrowsAsync<NotFoundAppException>(() => new DownloadMemoryCollectionCommandHandler(db)
            .Handle(new("user-a", collection.Id, "zh"), default));
        Assert.Empty(await db.MemoryFolders.ToListAsync());
    }

    [Fact]
    public async Task SaveRejectsDuplicateLessonsAndStaleVersion()
    {
        await using var db = CreateDb();
        var collection = await SeedCollection(db);
        var input = new PredefinedMemoryCollectionRequest
        {
            TitleEn = "Dictation", TitleZh = "听写", CategoryId = collection.CategoryId,
            LessonIds = [collection.Lessons.First().LessonId, collection.Lessons.First().LessonId]
        };
        var handler = new SaveMemoryCollectionCommandHandler(db);
        await Assert.ThrowsAsync<ValidationAppException>(() => handler.Handle(new(null, input), default));
        input.LessonIds = [];
        input.ExpectedVersion = 0;
        await Assert.ThrowsAsync<ConflictAppException>(() => handler.Handle(new(collection.Id, input), default));
    }

    [Fact]
    public async Task CollectionsInTheSameCategoryKeepIndependentMembershipAndExplicitOrder()
    {
        await using var db = CreateDb();
        var original = await SeedCollection(db);
        var lessonIds = original.Lessons.OrderBy(x => x.Position).Select(x => x.LessonId).ToList();
        var input = new PredefinedMemoryCollectionRequest
        {
            TitleEn = "Second collection", TitleZh = "第二个合集", CategoryId = original.CategoryId,
            IsPublished = true, LessonIds = [lessonIds[2], lessonIds[0]]
        };
        var handler = new SaveMemoryCollectionCommandHandler(db);
        var second = (await handler.Handle(new(null, input), default)).Data!;
        Assert.NotEqual(original.Id, second.Id);
        Assert.Equal(input.LessonIds, second.Lessons.Select(x => x.Id));
        input.ExpectedVersion = second.Version;
        input.LessonIds = [lessonIds[0], lessonIds[1]];
        var edited = (await handler.Handle(new(second.Id, input), default)).Data!;
        Assert.Equal(input.LessonIds, edited.Lessons.Select(x => x.Id));
        Assert.Equal(second.Version + 1, edited.Version);
        var catalogue = (await new GetMemoryCollectionsQueryHandler(db).Handle(new(true), default)).Data!;
        Assert.Equal(2, catalogue.Count);
        Assert.Equal(10, catalogue.Single(x => x.Id == original.Id).Lessons.Count);
        Assert.Equal(2, catalogue.Single(x => x.Id == second.Id).Lessons.Count);
    }

    private static AppDbContext CreateDb() => new(new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private static async Task<PredefinedMemoryCollection> SeedCollection(AppDbContext db)
    {
        var category = new PredefinedMemoryLessonCategory { NameEn = "Languages", NameZh = "语言", Key = "languages" };
        var collection = new PredefinedMemoryCollection
        {
            TitleEn = "Chinese Dictation 1", TitleZh = "中文听写集1", Category = category, CategoryId = category.Id, IsPublished = true
        };
        for (var i = 1; i <= 10; i++)
        {
            var lesson = new PredefinedMemoryLesson
            {
                Key = $"dictation-{i}", TitleEn = $"Dictation {i}", TitleZh = $"听写 {i}",
                Category = category, CategoryId = category.Id, IsPublished = true,
                Items = [new PredefinedMemoryLessonItem { Position = 1, ContentEn = "Spring", ContentZh = "春天" }]
            };
            collection.Lessons.Add(new() { Lesson = lesson, LessonId = lesson.Id, CollectionId = collection.Id, Position = i });
        }
        db.PredefinedMemoryCollections.Add(collection);
        await db.SaveChangesAsync();
        return collection;
    }
}
