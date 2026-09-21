using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.PredefinedMemoryLessons.Commands;
using MemoPal.Application.Features.PredefinedMemoryLessons.DTOs;
using MemoPal.Application.Features.PredefinedMemoryLessons.Queries;
using MemoPal.Infrastructure.Persistence;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.UnitTests;

public sealed class PredefinedMemoryLessonTests
{
    [Fact]
    public async Task Admin_Can_Create_Any_Bilingual_Lesson_Category()
    {
        await using var db = CreateDbContext("admin-category-editor");
        var request = new PredefinedMemoryLessonCategoryUpsertRequest
        {
            Key = "exam-revision",
            NameEn = "Exam Revision",
            NameZh = "考试复习",
            DescriptionEn = "Ready-made exam topics.",
            DescriptionZh = "预设考试主题。",
            Emoji = "🎯",
            SortOrder = 25,
            IsActive = true
        };

        var created = await new CreatePredefinedMemoryLessonCategoryCommandHandler(db).Handle(
            new CreatePredefinedMemoryLessonCategoryCommand(request), default);

        Assert.Equal("exam-revision", created.Data!.Key);
        Assert.Equal("考试复习", created.Data.NameZh);
        Assert.Equal("admin-category-editor", created.Data.CreatedBy);
    }

    [Fact]
    public async Task Admin_Can_Create_And_Update_Audited_Bilingual_Lesson()
    {
        await using var db = CreateDbContext("admin-lesson-editor");
        var category = await AddCategory(db);
        var request = BuildRequest("primary-spelling", category.Id, isPublished: false);
        var created = await new CreatePredefinedMemoryLessonCommandHandler(db).Handle(
            new CreatePredefinedMemoryLessonCommand(request), default);

        Assert.Equal(1, created.Data!.Version);
        Assert.Equal("admin-lesson-editor", created.Data.CreatedBy);
        Assert.All(created.Data.Items, item => Assert.Equal("admin-lesson-editor", item.CreatedBy));

        request.ExpectedVersion = created.Data.Version;
        request.IsPublished = true;
        request.Items =
        [
            new PredefinedMemoryLessonItemInput
            {
                Id = created.Data.Items[0].Id,
                Position = 1,
                ContentEn = "rhythm",
                ContentZh = "rhythm",
                AssociationEn = "A rhythm drum rolls through the first peg.",
                AssociationZh = "节奏鼓在第一个数字桩上滚过。"
            },
            new PredefinedMemoryLessonItemInput
            {
                Position = 2,
                ContentEn = "necessary",
                ContentZh = "necessary",
                AssociationEn = "Necessary letters march in a bright parade.",
                AssociationZh = "必要的字母排成一队明亮地走过。"
            }
        ];
        var updated = await new UpdatePredefinedMemoryLessonCommandHandler(db).Handle(
            new UpdatePredefinedMemoryLessonCommand(created.Data.Id, request), default);

        Assert.True(updated.Data!.IsPublished);
        Assert.Equal(2, updated.Data.Version);
        Assert.Equal(2, updated.Data.Items.Count);
        Assert.Equal("admin-lesson-editor", updated.Data.UpdatedBy);
    }

    [Fact]
    public async Task Published_Catalogue_Excludes_Drafts_And_Uses_Sort_Order()
    {
        await using var db = CreateDbContext("admin-lesson-editor");
        var category = await AddCategory(db);
        var handler = new CreatePredefinedMemoryLessonCommandHandler(db);
        var later = BuildRequest("later-lesson", category.Id, isPublished: true);
        later.SortOrder = 20;
        var first = BuildRequest("first-lesson", category.Id, isPublished: true);
        first.SortOrder = 10;
        await handler.Handle(new CreatePredefinedMemoryLessonCommand(later), default);
        await handler.Handle(new CreatePredefinedMemoryLessonCommand(BuildRequest("draft-lesson", category.Id, false)), default);
        await handler.Handle(new CreatePredefinedMemoryLessonCommand(first), default);

        var result = await new GetPublishedPredefinedMemoryLessonsQueryHandler(db).Handle(
            new GetPublishedPredefinedMemoryLessonsQuery(), default);

        Assert.Equal(["first-lesson", "later-lesson"], result.Data!.Select(x => x.Key));
    }

    [Fact]
    public async Task Published_Lesson_Requires_Bilingual_Authored_Associations()
    {
        await using var db = CreateDbContext("admin-lesson-editor");
        var category = await AddCategory(db);
        var request = BuildRequest("missing-association", category.Id, isPublished: true);
        request.Items[0].AssociationZh = "";

        var error = await Assert.ThrowsAsync<ValidationAppException>(() =>
            new CreatePredefinedMemoryLessonCommandHandler(db).Handle(
                new CreatePredefinedMemoryLessonCommand(request), default));

        Assert.Contains("Chinese association", error.Message);
    }

    [Fact]
    public async Task Duplicate_Key_Is_Rejected()
    {
        await using var db = CreateDbContext("admin-lesson-editor");
        var category = await AddCategory(db);
        var handler = new CreatePredefinedMemoryLessonCommandHandler(db);
        await handler.Handle(new CreatePredefinedMemoryLessonCommand(BuildRequest("same-key", category.Id, true)), default);

        await Assert.ThrowsAsync<ConflictAppException>(() => handler.Handle(
            new CreatePredefinedMemoryLessonCommand(BuildRequest("same-key", category.Id, true)), default));
    }

    [Fact]
    public async Task Category_In_Use_Cannot_Be_Deleted()
    {
        await using var db = CreateDbContext("admin-category-editor");
        var category = await AddCategory(db);
        await new CreatePredefinedMemoryLessonCommandHandler(db).Handle(
            new CreatePredefinedMemoryLessonCommand(BuildRequest("uses-category", category.Id, true)), default);

        await Assert.ThrowsAsync<ConflictAppException>(() =>
            new DeletePredefinedMemoryLessonCategoryCommandHandler(db).Handle(
                new DeletePredefinedMemoryLessonCategoryCommand(category.Id), default));
    }

    [Fact]
    public async Task Starter_Lesson_Must_Be_A_Short_Number_Peg_Lesson()
    {
        await using var db = CreateDbContext("admin-starter-editor");
        var category = await AddCategory(db);
        var request = BuildRequest("starter-lesson", category.Id, isPublished: true);
        request.IsStarterLesson = true;

        var tooShort = await Assert.ThrowsAsync<ValidationAppException>(() =>
            new CreatePredefinedMemoryLessonCommandHandler(db).Handle(
                new CreatePredefinedMemoryLessonCommand(request), default));
        Assert.Contains("between 2 and 5", tooShort.Message);

        request.Items =
        [
            request.Items[0],
            new PredefinedMemoryLessonItemInput
            {
                Position = 2,
                ContentEn = "apple",
                ContentZh = "苹果",
                AssociationEn = "An apple bounces onto the second peg.",
                AssociationZh = "苹果跳到第二个数字桩上。"
            }
        ];
        var created = await new CreatePredefinedMemoryLessonCommandHandler(db).Handle(
            new CreatePredefinedMemoryLessonCommand(request), default);
        Assert.True(created.Data!.IsStarterLesson);
    }

    private static PredefinedMemoryLessonUpsertRequest BuildRequest(string key, string categoryId, bool isPublished) => new()
    {
        Key = key,
        TitleEn = "Spelling Safari",
        TitleZh = "拼写探险",
        DescriptionEn = "Remember a tricky word.",
        DescriptionZh = "记住一个容易拼错的单词。",
        Emoji = "🦁",
        CategoryId = categoryId,
        TechniqueKey = "number-peg",
        GoalType = "spelling",
        SortOrder = 100,
        IsPublished = isPublished,
        Items =
        [
            new PredefinedMemoryLessonItemInput
            {
                Position = 1,
                ContentEn = "rhythm",
                ContentZh = "rhythm",
                AssociationEn = "A rhythm drum rolls into the first peg.",
                AssociationZh = "节奏鼓滚进第一个数字桩。"
            }
        ]
    };

    private static async Task<PredefinedMemoryLessonCategory> AddCategory(AppDbContext db)
    {
        var category = new PredefinedMemoryLessonCategory
        {
            Key = $"category-{Guid.NewGuid():N}",
            NameEn = "Languages",
            NameZh = "语言学习",
            DescriptionEn = "Language memories",
            DescriptionZh = "语言记忆",
            Emoji = "📝",
            IsActive = true
        };
        db.PredefinedMemoryLessonCategories.Add(category);
        await db.SaveChangesAsync();
        return category;
    }

    private static AppDbContext CreateDbContext(string userId)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        return new AppDbContext(options, new TestCurrentUserAccessor(userId));
    }

    private sealed class TestCurrentUserAccessor(string userId) : ICurrentUserAccessor
    {
        public string? UserId { get; } = userId;
    }
}
