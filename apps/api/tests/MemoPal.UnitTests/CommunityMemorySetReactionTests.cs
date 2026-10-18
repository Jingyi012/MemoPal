using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.CommunityMemorySets.Commands;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.UnitTests;

public sealed class CommunityMemorySetReactionTests
{
    [Fact]
    public async Task Helpful_reaction_is_idempotent_reversible_and_cannot_be_self_awarded()
    {
        await using var db = CreateDbContext("reactor");
        db.Users.AddRange(
            new User { Id = "reactor", Email = "reactor@example.com" },
            new User { Id = "author", Email = "author@example.com" });
        db.MemorySets.Add(new MemorySet
        {
            Id = "public-set", UserId = "author", Title = "Public set",
            Visibility = MemorySetVisibilities.Public, CommunityStatus = MemorySetCommunityStatuses.Visible,
            Status = MemorySetStatuses.Ready,
        });
        await db.SaveChangesAsync();
        var handler = new SetCommunityMemorySetHelpfulCommandHandler(db);

        var first = (await handler.Handle(new SetCommunityMemorySetHelpfulCommand("reactor", "public-set", true), default)).Data!;
        var repeated = (await handler.Handle(new SetCommunityMemorySetHelpfulCommand("reactor", "public-set", true), default)).Data!;
        var removed = (await handler.Handle(new SetCommunityMemorySetHelpfulCommand("reactor", "public-set", false), default)).Data!;
        var repeatedRemoval = (await handler.Handle(new SetCommunityMemorySetHelpfulCommand("reactor", "public-set", false), default)).Data!;

        Assert.Equal(1, first.HelpfulCount);
        Assert.True(first.IsHelpful);
        Assert.Equal(1, repeated.HelpfulCount);
        Assert.Equal(0, removed.HelpfulCount);
        Assert.False(removed.IsHelpful);
        Assert.Equal(0, repeatedRemoval.HelpfulCount);
        await Assert.ThrowsAsync<ValidationAppException>(() => handler.Handle(
            new SetCommunityMemorySetHelpfulCommand("author", "public-set", true), default));
        Assert.Equal(1, await db.CommunityMemorySetReactions.CountAsync());
    }

    [Fact]
    public async Task Helpful_reaction_rejects_hidden_or_private_content()
    {
        await using var db = CreateDbContext("reactor");
        db.Users.AddRange(
            new User { Id = "reactor", Email = "reactor@example.com" },
            new User { Id = "author", Email = "author@example.com" });
        db.MemorySets.Add(new MemorySet
        {
            Id = "private-set", UserId = "author", Title = "Private set",
            Visibility = MemorySetVisibilities.Private, Status = MemorySetStatuses.Ready,
        });
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<NotFoundAppException>(() => new SetCommunityMemorySetHelpfulCommandHandler(db)
            .Handle(new SetCommunityMemorySetHelpfulCommand("reactor", "private-set", true), default));
        Assert.Empty(await db.CommunityMemorySetReactions.ToListAsync());
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
