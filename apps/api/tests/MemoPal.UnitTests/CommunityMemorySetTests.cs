using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.CommunityMemorySets.Commands;
using MemoPal.Application.Features.CommunityMemorySets.DTOs;
using MemoPal.Application.Features.CommunityMemorySets.Queries;
using MemoPal.Application.Features.MemorySets.Commands;
using MemoPal.Application.Features.MemorySets.DTOs;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.UnitTests;

public sealed class CommunityMemorySetTests
{
    [Fact]
    public async Task Public_Discovery_Should_Isolate_Private_And_Hidden_Memories()
    {
        var options = CreateOptions();
        const string ownerId = "community-owner";
        const string readerId = "community-reader";
        string memorySetId;
        await using (var ownerDb = CreateDb(options, ownerId))
        {
            ownerDb.Users.AddRange(CreateUser(ownerId), CreateUser(readerId));
            await ownerDb.SaveChangesAsync();
            var created = await new CreateMemorySetCommandHandler(ownerDb).Handle(
                new CreateMemorySetCommand(ownerId, BuildNumberPegRequest()), default);
            memorySetId = created.Data!.Id;
        }

        await using (var readerDb = CreateDb(options, readerId))
        {
            var beforePublish = await Browse(readerDb, readerId);
            Assert.Empty(beforePublish.Data!);
            await Assert.ThrowsAsync<NotFoundAppException>(() =>
                new GetCommunityMemorySetQueryHandler(readerDb).Handle(
                    new GetCommunityMemorySetQuery(readerId, memorySetId), default));
            await Assert.ThrowsAsync<NotFoundAppException>(() =>
                new UpdateMemorySetVisibilityCommandHandler(readerDb).Handle(
                    new UpdateMemorySetVisibilityCommand(readerId, memorySetId, MemorySetVisibilities.Public), default));
        }

        await using (var ownerDb = CreateDb(options, ownerId))
        {
            await new UpdateMemorySetVisibilityCommandHandler(ownerDb).Handle(
                new UpdateMemorySetVisibilityCommand(ownerId, memorySetId, MemorySetVisibilities.Public), default);
        }

        await using (var readerDb = CreateDb(options, readerId))
        {
            var visible = await Browse(readerDb, readerId);
            Assert.Single(visible.Data!);
            var detail = await new GetCommunityMemorySetQueryHandler(readerDb).Handle(
                new GetCommunityMemorySetQuery(readerId, memorySetId), default);
            Assert.Equal(ownerId, detail.Data!.Author.Id);
            Assert.Null(detail.Data.ExistingCopyId);

            var report = await new ReportCommunityMemorySetCommandHandler(readerDb).Handle(
                new ReportCommunityMemorySetCommand(readerId, memorySetId,
                    new ReportMemorySetRequest { Reason = "spam" }), default);
            Assert.Equal("spam", report.Data!.Reason);
        }

        await using (var adminDb = CreateDb(options, "admin"))
        {
            await new ModerateCommunityMemorySetCommandHandler(adminDb).Handle(
                new ModerateCommunityMemorySetCommand(memorySetId, true, "Reported content"), default);
        }

        await using (var readerDb = CreateDb(options, readerId))
        {
            Assert.Empty((await Browse(readerDb, readerId)).Data!);
            await Assert.ThrowsAsync<NotFoundAppException>(() =>
                new CopyCommunityMemorySetCommandHandler(readerDb).Handle(
                    new CopyCommunityMemorySetCommand(readerId, memorySetId), default));
        }

        await using (var adminDb = CreateDb(options, "admin"))
        {
            await new ModerateCommunityMemorySetCommandHandler(adminDb).Handle(
                new ModerateCommunityMemorySetCommand(memorySetId, false, null), default);
        }
        await using (var readerDb = CreateDb(options, readerId))
            Assert.Single((await Browse(readerDb, readerId)).Data!);

        await using (var ownerDb = CreateDb(options, ownerId))
        {
            await new UpdateMemorySetVisibilityCommandHandler(ownerDb).Handle(
                new UpdateMemorySetVisibilityCommand(ownerId, memorySetId, MemorySetVisibilities.Private), default);
        }

        await using (var adminDb = CreateDb(options, "admin"))
        {
            var adminPage = await new GetAdminCommunityMemorySetsQueryHandler(adminDb).Handle(
                new GetAdminCommunityMemorySetsQuery(null, null, 1, 20), default);
            Assert.Empty(adminPage.Data!);
            await Assert.ThrowsAsync<NotFoundAppException>(() =>
                new ModerateCommunityMemorySetCommandHandler(adminDb).Handle(
                    new ModerateCommunityMemorySetCommand(memorySetId, true, "No longer public"), default));
        }
    }

    [Fact]
    public async Task Copy_Should_Be_Deep_Private_Audited_And_Idempotent()
    {
        var options = CreateOptions();
        const string ownerId = "copy-owner";
        const string readerId = "copy-reader";
        string sourceId;
        await using (var ownerDb = CreateDb(options, ownerId))
        {
            ownerDb.Users.AddRange(CreateUser(ownerId), CreateUser(readerId));
            await ownerDb.SaveChangesAsync();
            var created = await new CreateMemorySetCommandHandler(ownerDb).Handle(
                new CreateMemorySetCommand(ownerId, BuildNumberPegRequest()), default);
            sourceId = created.Data!.Id;
            await new UpdateMemorySetVisibilityCommandHandler(ownerDb).Handle(
                new UpdateMemorySetVisibilityCommand(ownerId, sourceId, MemorySetVisibilities.Public), default);
        }

        string copyId;
        await using (var readerDb = CreateDb(options, readerId))
        {
            var handler = new CopyCommunityMemorySetCommandHandler(readerDb);
            var first = await handler.Handle(new CopyCommunityMemorySetCommand(readerId, sourceId), default);
            var second = await handler.Handle(new CopyCommunityMemorySetCommand(readerId, sourceId), default);
            copyId = first.Data!.MemorySet.Id;
            Assert.False(first.Data.AlreadyCopied);
            Assert.True(second.Data!.AlreadyCopied);
            Assert.Equal(copyId, second.Data.MemorySet.Id);
            Assert.Equal(MemorySetVisibilities.Private, first.Data.MemorySet.Visibility);

            var copy = await readerDb.MemorySets.Include(x => x.Items)
                .Include(x => x.TechniquePlan!).ThenInclude(x => x.PegBindings)
                .SingleAsync(x => x.Id == copyId);
            Assert.Equal(sourceId, copy.CopiedFromMemorySetId);
            Assert.Equal(readerId, copy.CreatedBy);
            Assert.All(copy.Items, x => Assert.Equal(readerId, x.CreatedBy));
            Assert.All(copy.TechniquePlan!.PegBindings, x => Assert.Equal(readerId, x.CreatedBy));
        }

        await using (var ownerDb = CreateDb(options, ownerId))
        {
            var source = await ownerDb.MemorySets.Include(x => x.Items).SingleAsync(x => x.Id == sourceId);
            source.Items.First().Answer = "changed original";
            source.IsDeleted = true;
            await ownerDb.SaveChangesAsync();
        }
        await using (var readerDb = CreateDb(options, readerId))
        {
            var copy = await readerDb.MemorySets.Include(x => x.Items).SingleAsync(x => x.Id == copyId);
            Assert.DoesNotContain(copy.Items, x => x.Answer == "changed original");
            Assert.False(copy.IsDeleted);
        }
    }

    [Fact]
    public async Task Publishing_Private_Assets_Should_Require_Explicit_Confirmation()
    {
        var options = CreateOptions();
        const string ownerId = "palace-owner";
        await using var db = CreateDb(options, ownerId);
        db.Users.Add(CreateUser(ownerId));
        var customScene = new PalaceScene
        {
            UserId = ownerId,
            Name = "My room",
            ImageUrl = "/uploads/private-room.jpg",
            Status = PalaceSceneStatuses.Published,
            IsTemplate = false,
            Loci = [new PalaceLocus { Position = 1, Name = "Desk", XPercent = 50, YPercent = 50 }]
        };
        db.PalaceScenes.Add(customScene);
        await db.SaveChangesAsync();
        var request = new MemorySetUpsertRequest
        {
            Title = "Private room memory",
            GoalType = MemoryGoalTypes.Facts,
            TechniqueKey = MemoryTechniqueKeys.Palace,
            Status = MemorySetStatuses.Ready,
            Visibility = MemorySetVisibilities.Private,
            Items = [new MemoryItemInput { Position = 1, Prompt = "One", Answer = "Secret" }],
            TechniquePlan = new TechniquePlanInput
            {
                PalaceSceneId = customScene.Id,
                PalaceBindings = [new PalaceBindingInput
                {
                    ItemPosition = 1,
                    LocusId = customScene.Loci.Single().Id,
                    AssociationText = "Secret dances on desk",
                    IsCustomScene = true,
                    SceneAssetUrl = "/uploads/private-association.jpg"
                }]
            }
        };
        var created = await new CreateMemorySetCommandHandler(db).Handle(
            new CreateMemorySetCommand(ownerId, request), default);

        var error = await Assert.ThrowsAsync<ValidationAppException>(() =>
            new UpdateMemorySetVisibilityCommandHandler(db).Handle(
                new UpdateMemorySetVisibilityCommand(ownerId, created.Data!.Id, MemorySetVisibilities.Public), default));
        Assert.Contains("confirm", error.Message, StringComparison.OrdinalIgnoreCase);

        var published = await new UpdateMemorySetVisibilityCommandHandler(db).Handle(
            new UpdateMemorySetVisibilityCommand(
                ownerId, created.Data!.Id, MemorySetVisibilities.Public, ConfirmPrivateAssets: true), default);
        Assert.Equal(MemorySetVisibilities.Public, published.Data!.Visibility);
        Assert.True((await db.MemorySets.SingleAsync(x => x.Id == created.Data.Id)).SharesPrivateAssets);
    }

    [Fact]
    public async Task Copy_Custom_Palace_Should_Create_Independent_Scene_And_Loci()
    {
        var options = CreateOptions();
        const string ownerId = "custom-palace-owner";
        const string readerId = "custom-palace-reader";
        string sourceId;
        string sourceSceneId;
        string sourceLocusId;

        await using (var ownerDb = CreateDb(options, ownerId))
        {
            ownerDb.Users.AddRange(CreateUser(ownerId), CreateUser(readerId));
            var sourceScene = new PalaceScene
            {
                UserId = ownerId,
                Name = "My room",
                Description = "A familiar room",
                ImageUrl = "/uploads/private-room.jpg",
                Status = PalaceSceneStatuses.Published,
                IsTemplate = false,
                Loci = [new PalaceLocus
                {
                    Position = 1,
                    Name = "Desk",
                    Description = "The wooden desk",
                    XPercent = 40,
                    YPercent = 60
                }]
            };
            ownerDb.PalaceScenes.Add(sourceScene);
            await ownerDb.SaveChangesAsync();
            sourceSceneId = sourceScene.Id;
            sourceLocusId = sourceScene.Loci.Single().Id;

            var created = await new CreateMemorySetCommandHandler(ownerDb).Handle(
                new CreateMemorySetCommand(ownerId, new MemorySetUpsertRequest
                {
                    Title = "Shared room",
                    GoalType = MemoryGoalTypes.Facts,
                    TechniqueKey = MemoryTechniqueKeys.Palace,
                    Status = MemorySetStatuses.Ready,
                    Visibility = MemorySetVisibilities.Private,
                    Items = [new MemoryItemInput { Position = 1, Prompt = "One", Answer = "Apple" }],
                    TechniquePlan = new TechniquePlanInput
                    {
                        PalaceSceneId = sourceScene.Id,
                        PalaceBindings = [new PalaceBindingInput
                        {
                            ItemPosition = 1,
                            LocusId = sourceLocusId,
                            AssociationText = "An apple dances on the desk",
                            IsCustomScene = true
                        }]
                    }
                }), default);
            sourceId = created.Data!.Id;
            await new UpdateMemorySetVisibilityCommandHandler(ownerDb).Handle(
                new UpdateMemorySetVisibilityCommand(
                    ownerId, sourceId, MemorySetVisibilities.Public, ConfirmPrivateAssets: true), default);
        }

        string copiedSceneId;
        await using (var readerDb = CreateDb(options, readerId))
        {
            var result = await new CopyCommunityMemorySetCommandHandler(readerDb).Handle(
                new CopyCommunityMemorySetCommand(readerId, sourceId), default);
            var copy = await readerDb.MemorySets
                .Include(x => x.TechniquePlan!).ThenInclude(x => x.PalaceBindings)
                .SingleAsync(x => x.Id == result.Data!.MemorySet.Id);
            copiedSceneId = copy.TechniquePlan!.PalaceSceneId!;
            Assert.NotEqual(sourceSceneId, copiedSceneId);

            var copiedScene = await readerDb.PalaceScenes.Include(x => x.Loci)
                .SingleAsync(x => x.Id == copiedSceneId);
            Assert.Equal(readerId, copiedScene.UserId);
            Assert.False(copiedScene.IsTemplate);
            Assert.Equal("Desk", copiedScene.Loci.Single().Name);
            Assert.NotEqual(sourceLocusId, copiedScene.Loci.Single().Id);
            Assert.Equal(copiedScene.Loci.Single().Id, copy.TechniquePlan.PalaceBindings.Single().LocusId);
        }

        await using (var ownerDb = CreateDb(options, ownerId))
        {
            var sourceScene = await ownerDb.PalaceScenes.Include(x => x.Loci)
                .SingleAsync(x => x.Id == sourceSceneId);
            sourceScene.Loci.Single().Name = "Changed source locus";
            await ownerDb.SaveChangesAsync();
        }
        await using (var readerDb = CreateDb(options, readerId))
        {
            var copiedScene = await readerDb.PalaceScenes.Include(x => x.Loci)
                .SingleAsync(x => x.Id == copiedSceneId);
            Assert.Equal("Desk", copiedScene.Loci.Single().Name);
        }
    }

    private static Task<MemoPal.Application.Common.PaginatedResponse<CommunityMemorySetSummaryDto>> Browse(
        AppDbContext db, string userId) =>
        new GetCommunityMemorySetsQueryHandler(db).Handle(
            new GetCommunityMemorySetsQuery(userId, null, null, null, "newest", 1, 20), default);

    private static DbContextOptions<AppDbContext> CreateOptions() =>
        new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

    private static AppDbContext CreateDb(DbContextOptions<AppDbContext> options, string userId) =>
        new(options, new TestCurrentUserAccessor(userId));

    private static User CreateUser(string id) => new()
    {
        Id = id,
        Email = $"{id}@example.com",
        DisplayName = id,
        PasswordHash = "hash"
    };

    private static MemorySetUpsertRequest BuildNumberPegRequest() => new()
    {
        Title = "Public shopping list",
        GoalType = MemoryGoalTypes.OrderedList,
        TechniqueKey = MemoryTechniqueKeys.NumberPeg,
        Status = MemorySetStatuses.Ready,
        Visibility = MemorySetVisibilities.Private,
        Items = [new MemoryItemInput { Position = 1, Prompt = "First", Answer = "apple" }],
        TechniquePlan = new TechniquePlanInput
        {
            PegBindings = [new PegBindingInput
            {
                ItemPosition = 1,
                PegNumber = 1,
                SceneText = "A candle launches an apple"
            }]
        }
    };

    private sealed class TestCurrentUserAccessor(string userId) : ICurrentUserAccessor
    {
        public string? UserId { get; } = userId;
    }
}
