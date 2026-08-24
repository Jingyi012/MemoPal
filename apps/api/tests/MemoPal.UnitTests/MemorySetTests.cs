using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.MemorySets.Commands;
using MemoPal.Application.Features.MemorySets.DTOs;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.UnitTests;

public sealed class MemorySetTests
{
    [Fact]
    public async Task NumberPegLifecycle_Should_Audit_Create_Update_And_Delete()
    {
        const string userId = "user-peg";
        await using var db = CreateDbContext(userId);
        db.Users.Add(CreateUser(userId));
        await db.SaveChangesAsync();

        var createHandler = new CreateMemorySetCommandHandler(db);
        var created = await createHandler.Handle(
            new CreateMemorySetCommand(userId, BuildNumberPegRequest()),
            default);

        Assert.True(created.Success);
        Assert.NotNull(created.Data);
        Assert.Equal(1, created.Data.Version);
        Assert.Equal(2, created.Data.Items.Count);

        var entity = await db.MemorySets
            .Include(x => x.Items)
            .Include(x => x.TechniquePlan!)
                .ThenInclude(x => x.PegBindings)
            .SingleAsync(x => x.Id == created.Data.Id);

        AssertAudit(entity, userId);
        Assert.All(entity.Items, item => AssertAudit(item, userId));
        Assert.NotNull(entity.TechniquePlan);
        var techniquePlan = entity.TechniquePlan!;
        AssertAudit(techniquePlan, userId);
        Assert.All(techniquePlan.PegBindings, binding => AssertAudit(binding, userId));

        var updateRequest = BuildNumberPegRequest();
        updateRequest.ExpectedVersion = 1;
        updateRequest.Items[1].Answer = "milk";
        updateRequest.TechniquePlan!.PegBindings[1].SceneText = "A swan swimming through a giant milk splash";

        var updateHandler = new UpdateMemorySetCommandHandler(db);
        var updated = await updateHandler.Handle(
            new UpdateMemorySetCommand(userId, entity.Id, updateRequest),
            default);

        Assert.Equal(2, updated.Data!.Version);
        Assert.Equal("milk", updated.Data.Items[1].Answer);
        Assert.Equal(userId, entity.UpdatedBy);
        Assert.Equal(userId, entity.Items.Single(x => x.Position == 2).UpdatedBy);
        Assert.Equal(
            userId,
            techniquePlan.PegBindings.Single(x => x.PegNumber == 2).UpdatedBy);

        var staleRequest = BuildNumberPegRequest();
        staleRequest.ExpectedVersion = 1;
        await Assert.ThrowsAsync<ConflictAppException>(() =>
            updateHandler.Handle(new UpdateMemorySetCommand(userId, entity.Id, staleRequest), default));

        var deleteHandler = new DeleteMemorySetCommandHandler(db);
        await deleteHandler.Handle(new DeleteMemorySetCommand(userId, entity.Id), default);

        Assert.True(entity.IsDeleted);
        Assert.NotNull(entity.DeletedAt);
        Assert.Equal(userId, entity.DeletedBy);
        Assert.Equal(userId, entity.UpdatedBy);
    }

    [Fact]
    public async Task NumberPeg_Should_Reject_More_Than_Ten_Items()
    {
        const string userId = "user-limit";
        await using var db = CreateDbContext(userId);
        var request = BuildNumberPegRequest();
        request.Items = Enumerable.Range(1, 11)
            .Select(position => new MemoryItemInput
            {
                Position = position,
                Prompt = $"Item {position}",
                Answer = $"Answer {position}"
            })
            .ToList();
        request.TechniquePlan = null;
        request.Status = MemorySetStatuses.Draft;

        var handler = new CreateMemorySetCommandHandler(db);
        var exception = await Assert.ThrowsAsync<ValidationAppException>(() =>
            handler.Handle(new CreateMemorySetCommand(userId, request), default));

        Assert.Contains("up to 10", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task PalaceMemorySet_Should_Use_Audited_Loci_From_Selected_Scene()
    {
        const string userId = "user-palace";
        await using var db = CreateDbContext(userId);
        db.Users.Add(CreateUser(userId));
        var scene = new PalaceScene
        {
            Name = "Cozy study",
            Description = "A warm room with clear landmarks",
            ImageUrl = "/uploads/palaces/cozy-study.webp",
            IsTemplate = true,
            Status = PalaceSceneStatuses.Published,
            Loci =
            [
                new PalaceLocus { Position = 1, Name = "Door", XPercent = 12, YPercent = 58 },
                new PalaceLocus { Position = 2, Name = "Desk", XPercent = 62, YPercent = 65 }
            ]
        };
        db.PalaceScenes.Add(scene);
        await db.SaveChangesAsync();

        var request = new MemorySetUpsertRequest
        {
            Title = "History dates",
            GoalType = MemoryGoalTypes.Facts,
            TechniqueKey = MemoryTechniqueKeys.Palace,
            Status = MemorySetStatuses.Ready,
            Items =
            [
                new MemoryItemInput { Position = 1, Prompt = "First date", Answer = "1215 Magna Carta" },
                new MemoryItemInput { Position = 2, Prompt = "Second date", Answer = "1969 Moon landing" }
            ],
            TechniquePlan = new TechniquePlanInput
            {
                PalaceSceneId = scene.Id,
                PalaceBindings =
                [
                    new PalaceBindingInput
                    {
                        ItemPosition = 1,
                        LocusId = scene.Loci.Single(x => x.Position == 1).Id,
                        AssociationText = "A giant scroll blocks the door"
                    },
                    new PalaceBindingInput
                    {
                        ItemPosition = 2,
                        LocusId = scene.Loci.Single(x => x.Position == 2).Id,
                        AssociationText = "The moon lands on the desk"
                    }
                ]
            }
        };

        var result = await new CreateMemorySetCommandHandler(db).Handle(
            new CreateMemorySetCommand(userId, request),
            default);

        Assert.True(result.Success);
        Assert.Equal(scene.Id, result.Data!.TechniquePlan!.PalaceSceneId);
        Assert.Equal(2, result.Data.TechniquePlan.PalaceBindings.Count);
        AssertAudit(scene, userId);
        Assert.All(scene.Loci, locus => AssertAudit(locus, userId));
    }

    [Fact]
    public async Task LibraryActions_Should_Archive_Restore_And_Duplicate_With_Audit_Metadata()
    {
        const string userId = "user-library";
        await using var db = CreateDbContext(userId);
        db.Users.Add(CreateUser(userId));
        await db.SaveChangesAsync();

        var created = await new CreateMemorySetCommandHandler(db).Handle(
            new CreateMemorySetCommand(userId, BuildNumberPegRequest()),
            default);
        var memorySetId = created.Data!.Id;
        var archiveHandler = new SetMemorySetArchivedCommandHandler(db);

        var archived = await archiveHandler.Handle(
            new SetMemorySetArchivedCommand(userId, memorySetId, true),
            default);
        Assert.Equal(MemorySetStatuses.Archived, archived.Data!.Status);
        Assert.Equal(2, archived.Data.Version);

        var restored = await archiveHandler.Handle(
            new SetMemorySetArchivedCommand(userId, memorySetId, false),
            default);
        Assert.Equal(MemorySetStatuses.Ready, restored.Data!.Status);
        Assert.Equal(3, restored.Data.Version);

        var duplicated = await new DuplicateMemorySetCommandHandler(db).Handle(
            new DuplicateMemorySetCommand(userId, memorySetId),
            default);

        Assert.NotNull(duplicated.Data);
        Assert.NotEqual(memorySetId, duplicated.Data.Id);
        Assert.Equal("Saturday shopping (copy)", duplicated.Data.Title);
        Assert.Equal(MemorySetVisibilities.Private, duplicated.Data.Visibility);
        Assert.Equal(2, duplicated.Data.Items.Count);
        Assert.Equal(2, duplicated.Data.TechniquePlan!.PegBindings.Count);

        var duplicateEntity = await db.MemorySets
            .Include(x => x.Items)
            .Include(x => x.TechniquePlan!)
                .ThenInclude(x => x.PegBindings)
            .SingleAsync(x => x.Id == duplicated.Data.Id);
        AssertAudit(duplicateEntity, userId);
        Assert.All(duplicateEntity.Items, item => AssertAudit(item, userId));
        AssertAudit(duplicateEntity.TechniquePlan!, userId);
        Assert.All(duplicateEntity.TechniquePlan!.PegBindings, binding => AssertAudit(binding, userId));

        var draft = await new CreateMemorySetCommandHandler(db).Handle(
            new CreateMemorySetCommand(userId, new MemorySetUpsertRequest
            {
                Title = "Unfinished spelling list",
                GoalType = MemoryGoalTypes.Spelling,
                TechniqueKey = MemoryTechniqueKeys.NumberPeg,
                Status = MemorySetStatuses.Draft,
                Visibility = MemorySetVisibilities.Private
            }),
            default);
        await archiveHandler.Handle(
            new SetMemorySetArchivedCommand(userId, draft.Data!.Id, true),
            default);
        var restoredDraft = await archiveHandler.Handle(
            new SetMemorySetArchivedCommand(userId, draft.Data.Id, false),
            default);
        Assert.Equal(MemorySetStatuses.Draft, restoredDraft.Data!.Status);
    }

    private static AppDbContext CreateDbContext(string userId)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        return new AppDbContext(options, new TestCurrentUserAccessor(userId));
    }

    private static User CreateUser(string id) => new()
    {
        Id = id,
        Email = $"{id}@example.com",
        DisplayName = "Peg Learner",
        PasswordHash = "hash"
    };

    private static MemorySetUpsertRequest BuildNumberPegRequest() => new()
    {
        Title = "Saturday shopping",
        GoalType = MemoryGoalTypes.OrderedList,
        TechniqueKey = MemoryTechniqueKeys.NumberPeg,
        Status = MemorySetStatuses.Ready,
        Visibility = MemorySetVisibilities.Private,
        Items =
        [
            new MemoryItemInput { Position = 1, Prompt = "First item", Answer = "apples" },
            new MemoryItemInput { Position = 2, Prompt = "Second item", Answer = "bread" }
        ],
        TechniquePlan = new TechniquePlanInput
        {
            PegBindings =
            [
                new PegBindingInput
                {
                    ItemPosition = 1,
                    PegNumber = 1,
                    SceneText = "A candle launching apples like fireworks"
                },
                new PegBindingInput
                {
                    ItemPosition = 2,
                    PegNumber = 2,
                    SceneText = "A swan wearing a loaf of bread as a hat"
                }
            ]
        }
    };

    private static void AssertAudit(MemoPal.Domain.Common.AuditableBaseEntity entity, string userId)
    {
        Assert.NotEqual(default, entity.CreatedAt);
        Assert.NotEqual(default, entity.UpdatedAt);
        Assert.Equal(userId, entity.CreatedBy);
        Assert.Equal(userId, entity.UpdatedBy);
    }

    private sealed class TestCurrentUserAccessor(string userId) : ICurrentUserAccessor
    {
        public string? UserId { get; } = userId;
    }
}
