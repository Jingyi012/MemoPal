using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Auth.Commands;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.UnitTests;

public sealed class OnboardingTests
{
    [Fact]
    public async Task Starter_Flow_Is_Account_Scoped_And_Resumable()
    {
        const string userId = "new-player";
        await using var db = CreateDbContext(userId);
        var user = new User
        {
            Id = userId,
            DisplayName = "New Player",
            Email = "new-player@example.com",
            OnboardingStatus = OnboardingStatuses.NotStarted
        };
        var category = new PredefinedMemoryLessonCategory
        {
            Id = "starter-category",
            Key = "starter-category",
            NameEn = "Everyday",
            NameZh = "日常",
            Emoji = "🧺",
            IsActive = true
        };
        var lesson = new PredefinedMemoryLesson
        {
            Id = "starter-lesson",
            Key = "starter-lesson",
            TitleEn = "Quick list",
            TitleZh = "快速清单",
            Emoji = "📝",
            CategoryId = category.Id,
            Category = category,
            TechniqueKey = MemoryTechniqueKeys.NumberPeg,
            GoalType = MemoryGoalTypes.OrderedList,
            IsPublished = true,
            IsStarterLesson = true
        };
        lesson.Items.Add(new PredefinedMemoryLessonItem
        {
            LessonId = lesson.Id,
            Position = 1,
            ContentEn = "apple",
            ContentZh = "苹果",
            AssociationEn = "An apple bounces onto the first peg.",
            AssociationZh = "苹果跳到第一个数字桩上。"
        });
        lesson.Items.Add(new PredefinedMemoryLessonItem
        {
            LessonId = lesson.Id,
            Position = 2,
            ContentEn = "water",
            ContentZh = "水",
            AssociationEn = "Water splashes over the second peg.",
            AssociationZh = "水花溅过第二个数字桩。"
        });
        db.Users.Add(user);
        db.PredefinedMemoryLessons.Add(lesson);
        await db.SaveChangesAsync();

        await new StartOnboardingCommandHandler(db).Handle(
            new StartOnboardingCommand(userId, category.Id, lesson.Id), default);

        Assert.Equal(OnboardingStatuses.InProgress, user.OnboardingStatus);
        Assert.Equal(OnboardingSteps.BuildMemory, user.OnboardingStep);
        Assert.Equal(lesson.Id, user.OnboardingSelectedLessonId);

        var memory = new MemorySet
        {
            UserId = userId,
            Title = "Quick list",
            GoalType = MemoryGoalTypes.OrderedList,
            TechniqueKey = MemoryTechniqueKeys.NumberPeg,
            Status = MemorySetStatuses.Ready,
            Visibility = MemorySetVisibilities.Private
        };
        db.MemorySets.Add(memory);
        await db.SaveChangesAsync();

        await new LinkOnboardingMemoryCommandHandler(db).Handle(
            new LinkOnboardingMemoryCommand(userId, memory.Id), default);
        Assert.Equal(OnboardingSteps.PracticeMemory, user.OnboardingStep);
        Assert.Equal(memory.Id, user.OnboardingMemorySetId);

        db.PracticeAttempts.Add(new PracticeAttempt
        {
            UserId = userId,
            MemorySetId = memory.Id,
            ClientAttemptId = "onboarding-first-recall",
            TechniqueKey = MemoryTechniqueKeys.NumberPeg,
            Mode = PracticeModes.Recall,
            StartedAt = DateTime.UtcNow.AddMinutes(-1),
            CompletedAt = DateTime.UtcNow,
            DurationMs = 60_000,
            CorrectCount = 2,
            FirstAttemptCorrectCount = 2,
            TotalCount = 2
        });
        await db.SaveChangesAsync();

        await new CompleteOnboardingCommandHandler(db).Handle(
            new CompleteOnboardingCommand(userId, memory.Id), default);

        Assert.Equal(OnboardingStatuses.Completed, user.OnboardingStatus);
        Assert.Equal(memory.Id, user.OnboardingMemorySetId);
        Assert.NotNull(user.OnboardingCompletedAt);
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
