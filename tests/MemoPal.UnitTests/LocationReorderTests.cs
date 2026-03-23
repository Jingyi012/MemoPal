using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Features.Locations.Commands;
using MemoPal.Application.Features.Locations.DTOs;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.UnitTests;

public class LocationReorderTests
{
    [Fact]
    public async Task ReorderLocationsCommandHandler_Should_Reassign_Positions_In_New_Order()
    {
        await using var db = CreateDbContext();
        db.Palaces.Add(CreatePalace("palace-1"));
        db.Locations.AddRange(
            CreateLocation("loc-1", "palace-1", 1),
            CreateLocation("loc-2", "palace-1", 2),
            CreateLocation("loc-3", "palace-1", 3));
        await db.SaveChangesAsync();

        var handler = new ReorderLocationsCommandHandler(db);
        var response = await handler.Handle(
            new ReorderLocationsCommand(
                UserId: "admin-user",
                PalaceId: "palace-1",
                Request: new LocationReorderRequest
                {
                    LocationIds = ["loc-3", "loc-1", "loc-2"]
                },
                IsAdmin: true),
            default);

        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.Equal(["loc-3", "loc-1", "loc-2"], response.Data.Select(x => x.Id).ToArray());

        var dbOrder = await db.Locations
            .Where(x => x.PalaceId == "palace-1" && !x.IsDeleted)
            .OrderBy(x => x.Position)
            .Select(x => x.Id)
            .ToListAsync();

        Assert.Equal(["loc-3", "loc-1", "loc-2"], dbOrder);
    }

    [Fact]
    public async Task ReorderLocationsCommandHandler_Should_Throw_When_Request_Does_Not_Match_Active_Locations()
    {
        await using var db = CreateDbContext();
        db.Palaces.Add(CreatePalace("palace-1"));
        db.Locations.AddRange(
            CreateLocation("loc-1", "palace-1", 1),
            CreateLocation("loc-2", "palace-1", 2),
            CreateLocation("loc-3", "palace-1", 3));
        await db.SaveChangesAsync();

        var handler = new ReorderLocationsCommandHandler(db);
        var ex = await Assert.ThrowsAsync<ValidationAppException>(() =>
            handler.Handle(
                new ReorderLocationsCommand(
                    UserId: "admin-user",
                    PalaceId: "palace-1",
                    Request: new LocationReorderRequest
                    {
                        LocationIds = ["loc-1", "loc-2"]
                    },
                    IsAdmin: true),
                default));

        Assert.Contains("each active location", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ReorderLocationsCommandHandler_Should_Normalize_Deleted_Positions_To_Negative()
    {
        await using var db = CreateDbContext();
        db.Palaces.Add(CreatePalace("palace-1"));
        db.Locations.AddRange(
            CreateLocation("loc-1", "palace-1", 1),
            CreateLocation("loc-2", "palace-1", 2),
            CreateLocation("loc-3", "palace-1", 3, isDeleted: true));
        await db.SaveChangesAsync();

        var handler = new ReorderLocationsCommandHandler(db);
        var response = await handler.Handle(
            new ReorderLocationsCommand(
                UserId: "admin-user",
                PalaceId: "palace-1",
                Request: new LocationReorderRequest
                {
                    LocationIds = ["loc-2", "loc-1"]
                },
                IsAdmin: true),
            default);

        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.Equal(["loc-2", "loc-1"], response.Data.Select(x => x.Id).ToArray());

        var deleted = await db.Locations.SingleAsync(x => x.Id == "loc-3");
        Assert.True(deleted.IsDeleted);
        Assert.True(deleted.Position < 0);
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        return new AppDbContext(options);
    }

    private static Palace CreatePalace(string id)
    {
        return new Palace
        {
            Id = id,
            Name = "Test Palace",
            Description = "Test Palace",
            LocationsCount = 3,
            Thumbnail = "thumb.png",
            IsLocked = false,
            RequiredXp = 0,
            IsPremium = false,
            IsCustom = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    private static Location CreateLocation(string id, string palaceId, int position, bool isDeleted = false)
    {
        return new Location
        {
            Id = id,
            PalaceId = palaceId,
            Position = position,
            Name = $"Location {position}",
            Description = $"Description {position}",
            ImageUrl = $"location-{position}.png",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsDeleted = isDeleted,
            DeletedAt = isDeleted ? DateTime.UtcNow : null
        };
    }
}
