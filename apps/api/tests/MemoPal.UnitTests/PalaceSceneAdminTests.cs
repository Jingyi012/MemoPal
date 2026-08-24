using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.PalaceScenes.Commands;
using MemoPal.Application.Features.PalaceScenes.DTOs;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.UnitTests;

public sealed class PalaceSceneAdminTests
{
    [Fact]
    public async Task CreateAndUpdate_Should_Audit_And_Version_SceneAndLoci()
    {
        await using var db = CreateDbContext("admin-1");
        var create = await new CreatePalaceSceneCommandHandler(db).Handle(
            new CreatePalaceSceneCommand(new PalaceSceneUpsertRequest
            {
                Name = "Village library",
                Description = "A warm library",
                ImageUrl = "/uploads/library.webp",
                Status = PalaceSceneStatuses.Published,
                Loci =
                [
                    new PalaceLocusInput { Position = 1, Name = "Door", XPercent = 10, YPercent = 55 },
                    new PalaceLocusInput { Position = 2, Name = "Desk", XPercent = 65, YPercent = 70 }
                ]
            }),
            default);

        Assert.Equal(1, create.Data!.Version);
        Assert.Equal("admin-1", create.Data.CreatedBy);
        Assert.All(create.Data.Loci, locus => Assert.Equal("admin-1", locus.CreatedBy));

        var updateRequest = new PalaceSceneUpsertRequest
        {
            Name = "Village library",
            Description = "Updated",
            ImageUrl = "/uploads/library.webp",
            Status = PalaceSceneStatuses.Published,
            ExpectedVersion = 1,
            Loci = create.Data.Loci.Select(locus => new PalaceLocusInput
            {
                Id = locus.Id,
                Position = locus.Position,
                Name = locus.Name,
                XPercent = locus.XPercent + 1,
                YPercent = locus.YPercent,
                RadiusPercent = locus.RadiusPercent
            }).ToList()
        };
        var updated = await new UpdatePalaceSceneCommandHandler(db).Handle(
            new UpdatePalaceSceneCommand(create.Data.Id, updateRequest),
            default);

        Assert.Equal(2, updated.Data!.Version);
        Assert.Equal("admin-1", updated.Data.UpdatedBy);
        Assert.All(updated.Data.Loci, locus => Assert.Equal("admin-1", locus.UpdatedBy));

        updateRequest.ExpectedVersion = 1;
        await Assert.ThrowsAsync<ConflictAppException>(() =>
            new UpdatePalaceSceneCommandHandler(db).Handle(
                new UpdatePalaceSceneCommand(create.Data.Id, updateRequest),
                default));
    }

    [Fact]
    public async Task CustomPalace_Should_Be_UserOwned_Editable_And_Audited()
    {
        const string userId = "custom-user";
        await using var db = CreateDbContext(userId);
        db.Users.Add(new User { Id = userId, DisplayName = "Custom User", Email = "custom@example.com", IsPremium = true });
        await db.SaveChangesAsync();

        var request = new PalaceSceneUpsertRequest
        {
            Name = "My study",
            Description = "A private route",
            ImageUrl = "/content/palace/study.webp",
            Status = PalaceSceneStatuses.Published,
            Loci =
            [
                new PalaceLocusInput { Position = 1, Name = "Window", XPercent = 20, YPercent = 35 },
                new PalaceLocusInput { Position = 2, Name = "Desk", XPercent = 70, YPercent = 70 }
            ]
        };

        var created = await new CreateCustomPalaceSceneCommandHandler(db).Handle(
            new CreateCustomPalaceSceneCommand(userId, request), default);

        Assert.False(created.Data!.IsTemplate);
        Assert.Equal(userId, (await db.PalaceScenes.SingleAsync(x => x.Id == created.Data.Id)).UserId);
        Assert.Equal(userId, created.Data.CreatedBy);

        request.ExpectedVersion = created.Data.Version;
        request.Description = "Updated private route";
        request.Loci = created.Data.Loci.Select(locus => new PalaceLocusInput
        {
            Id = locus.Id,
            Position = locus.Position,
            Name = locus.Name,
            XPercent = locus.XPercent,
            YPercent = locus.YPercent,
            RadiusPercent = locus.RadiusPercent
        }).ToList();
        var updated = await new UpdateCustomPalaceSceneCommandHandler(db).Handle(
            new UpdateCustomPalaceSceneCommand(userId, created.Data.Id, request), default);

        Assert.Equal(2, updated.Data!.Version);
        Assert.Equal(userId, updated.Data.UpdatedBy);

        var deleted = await new DeleteCustomPalaceSceneCommandHandler(db).Handle(
            new DeleteCustomPalaceSceneCommand(userId, created.Data.Id), default);
        Assert.True(deleted.Data);
        Assert.True((await db.PalaceScenes.IgnoreQueryFilters().SingleAsync(x => x.Id == created.Data.Id)).IsDeleted);
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
