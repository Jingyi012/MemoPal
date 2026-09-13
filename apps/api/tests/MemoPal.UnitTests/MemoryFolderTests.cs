using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Features.MemoryFolders.Commands;
using MemoPal.Application.Features.MemoryFolders.DTOs;
using MemoPal.Application.Features.MemoryFolders.Queries;
using MemoPal.Application.Features.MemorySets.Commands;
using MemoPal.Application.Features.MemorySets.DTOs;
using MemoPal.Application.Features.MemorySets.Queries;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using MemoPal.Application.Common.Interfaces;

namespace MemoPal.UnitTests;

public sealed class MemoryFolderTests
{
    [Fact]
    public async Task FolderSummary_Should_Count_Active_Sets_And_Items()
    {
        const string userId = "folder-summary-user";
        await using var db = CreateDbContext(userId);
        db.Users.Add(CreateUser(userId));
        var folder = new MemoryFolder { UserId = userId, Name = "Chinese dictation" };
        var memorySet = new MemorySet
        {
            UserId = userId,
            Title = "Dictation 27",
            Items =
            [
                new MemoryItem { Position = 1, Prompt = "一", Answer = "one" },
                new MemoryItem { Position = 2, Prompt = "二", Answer = "two", IsDeleted = true }
            ]
        };
        folder.MemorySets.Add(memorySet);
        db.MemoryFolders.Add(folder);
        await db.SaveChangesAsync();

        var result = await new GetMemoryFoldersQueryHandler(db)
            .Handle(new GetMemoryFoldersQuery(userId), default);

        var summary = Assert.Single(result.Data!);
        Assert.Equal(1, summary.MemorySetCount);
        Assert.Equal(1, summary.ItemCount);
    }

    [Fact]
    public async Task DeletingFolder_Should_SoftDeleteItsMemorySets()
    {
        const string userId = "folder-delete-user";
        await using var db = CreateDbContext(userId);
        db.Users.Add(CreateUser(userId));
        var folder = new MemoryFolder { UserId = userId, Name = "Countries" };
        var memorySet = new MemorySet { UserId = userId, Title = "Asia", MemoryFolder = folder };
        db.MemoryFolders.Add(folder);
        db.MemorySets.Add(memorySet);
        await db.SaveChangesAsync();

        await new DeleteMemoryFolderCommandHandler(db)
            .Handle(new DeleteMemoryFolderCommand(userId, folder.Id), default);

        Assert.True(folder.IsDeleted);
        Assert.True(memorySet.IsDeleted);
        Assert.Equal(folder.Id, memorySet.MemoryFolderId);
        Assert.Empty(await db.MemorySets
            .Where(x => !x.IsDeleted && x.MemoryFolderId == folder.Id)
            .ToListAsync());
        Assert.Null(await db.MemoryFolders.FirstOrDefaultAsync(x => x.Id == folder.Id && !x.IsDeleted));
    }

    [Fact]
    public async Task MovingMemorySet_Should_RejectAnotherUsersFolder_And_FilterByFolder()
    {
        const string userId = "folder-move-user";
        await using var db = CreateDbContext(userId);
        db.Users.AddRange(CreateUser(userId), CreateUser("other-user"));
        var ownFolder = new MemoryFolder { UserId = userId, Name = "Own" };
        var otherFolder = new MemoryFolder { UserId = "other-user", Name = "Other" };
        var memorySet = new MemorySet { UserId = userId, Title = "List" };
        db.MemoryFolders.AddRange(ownFolder, otherFolder);
        db.MemorySets.Add(memorySet);
        await db.SaveChangesAsync();

        var handler = new MoveMemorySetToFolderCommandHandler(db);
        await Assert.ThrowsAsync<NotFoundAppException>(() => handler.Handle(
            new MoveMemorySetToFolderCommand(userId, memorySet.Id, new MoveMemorySetToFolderRequest
            {
                FolderId = otherFolder.Id
            }), default));

        await handler.Handle(
            new MoveMemorySetToFolderCommand(userId, memorySet.Id, new MoveMemorySetToFolderRequest
            {
                FolderId = ownFolder.Id
            }), default);
        var filtered = await new GetPagedMemorySetsQueryHandler(db).Handle(
            new GetPagedMemorySetsQuery(userId, FolderId: ownFolder.Id), default);

        Assert.Equal(1, filtered.Pagination.TotalCount);
        Assert.Equal(memorySet.Id, Assert.Single(filtered.Data!).Id);
    }

    [Fact]
    public async Task CreatingMemorySet_Should_AssignOwnedFolder_And_RejectAnotherUsersFolder()
    {
        const string userId = "folder-create-user";
        await using var db = CreateDbContext(userId);
        db.Users.AddRange(CreateUser(userId), CreateUser("other-create-user"));
        var ownFolder = new MemoryFolder { UserId = userId, Name = "Owned" };
        var otherFolder = new MemoryFolder { UserId = "other-create-user", Name = "Not owned" };
        db.MemoryFolders.AddRange(ownFolder, otherFolder);
        await db.SaveChangesAsync();

        var handler = new CreateMemorySetCommandHandler(db);
        var created = await handler.Handle(new CreateMemorySetCommand(userId, BuildDraftRequest(ownFolder.Id)), default);
        Assert.Equal(ownFolder.Id, created.Data!.MemoryFolderId);

        await Assert.ThrowsAsync<NotFoundAppException>(() => handler.Handle(
            new CreateMemorySetCommand(userId, BuildDraftRequest(otherFolder.Id)), default));
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
        DisplayName = id,
        PasswordHash = "hash"
    };

    private static MemorySetUpsertRequest BuildDraftRequest(string folderId) => new()
    {
        MemoryFolderId = folderId,
        Title = "Folder memory",
        GoalType = MemoryGoalTypes.Custom,
        TechniqueKey = MemoryTechniqueKeys.NumberPeg,
        Status = MemorySetStatuses.Draft,
        Visibility = MemorySetVisibilities.Private,
        Items = []
    };

    private sealed class TestCurrentUserAccessor(string userId) : ICurrentUserAccessor
    {
        public string? UserId { get; } = userId;
    }
}
