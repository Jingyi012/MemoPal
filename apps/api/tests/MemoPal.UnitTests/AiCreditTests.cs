using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.AiCredits;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.AI;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace MemoPal.UnitTests;

public sealed class AiCreditTests
{
    [Theory]
    [InlineData("gemini", "image-key", true)]
    [InlineData("gemini", "", false)]
    [InlineData("unsupported", "image-key", false)]
    public async Task ImageAvailabilityUsesIndependentProviderConfiguration(string provider, string key, bool expected)
    {
        using var db = CreateDb();
        await SeedUser(db);
        var credits = new AiCreditService(db,
            Options.Create(new AiCreditOptions { ImagesEnabled = true }),
            Options.Create(new PalaceAssociationGenerationOptions { Provider = "template", GeminiApiKey = "text-only-key" }),
            Options.Create(new AiImageGenerationOptions { Provider = provider, Model = "image-model", ApiKey = key }));
        var balance = await credits.BalanceAsync("user", default);
        Assert.Equal(expected, balance.ImagesEnabled);
        Assert.Equal(0, balance.TextCost);
    }

    internal static AppDbContext CreateDb(string? name = null) => new(new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(name ?? Guid.NewGuid().ToString()).Options);
    internal static AiCreditService CreateService(AppDbContext db, bool paid = true) => new(db,
        Options.Create(new AiCreditOptions()), Options.Create(new PalaceAssociationGenerationOptions { Provider = paid ? "ollama" : "template" }), Options.Create(new AiImageGenerationOptions()));
    private static async Task SeedUser(AppDbContext db)
    {
        db.Users.Add(new User { Id = "user", Email = "credits@example.com", DisplayName = "Credits" });
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task ExpiringSubscriptionIsSpentBeforePurchasedCredits_AndPartialResultsReleaseRemainder()
    {
        using var db = CreateDb();
        await SeedUser(db);
        var credits = CreateService(db);
        await credits.GrantAsync("user", "purchase", "purchase", 20, null, default);
        await credits.GrantAsync("user", "month", "subscription", 3, DateTime.UtcNow.AddDays(1), default);
        var reservation = await credits.ReserveAsync("user", "request", "number-peg-text", new { word = "apple" }, 5, default);
        Assert.Equal(18, (await credits.BalanceAsync("user", default)).Available);
        await credits.CompleteAsync("user", reservation.Id, 2, new { result = "mixed" }, null, default);
        var balance = await credits.BalanceAsync("user", default);
        Assert.Equal(21, balance.Available);
        Assert.Equal(1, balance.Subscription);
        Assert.Equal(20, balance.Purchased);
        Assert.Equal(balance.Available, await db.AiCreditEntries.SumAsync(x => x.Amount));
        await credits.CompleteAsync("user", reservation.Id, 2, new { result = "mixed" }, null, default);
        Assert.Single(await db.AiCreditEntries.Where(x => x.Kind == "charge").ToListAsync());
    }

    [Fact]
    public async Task ConcurrentReservationsCannotOverspendOrDuplicate()
    {
        var name = Guid.NewGuid().ToString();
        using (var db = CreateDb(name))
        {
            await SeedUser(db);
            await CreateService(db).GrantAsync("user", "grant", "manual", 1, null, default);
        }
        var outcomes = await Task.WhenAll(Enumerable.Range(0, 10).Select(async i =>
        {
            using var db = CreateDb(name);
            try { await CreateService(db).ReserveAsync("user", $"request-{i}", "number-peg-text", new { }, 1, default); return true; }
            catch (AppException ex) when (ex.StatusCode == 402) { return false; }
        }));
        Assert.Single(outcomes, x => x);
        using var check = CreateDb(name);
        Assert.Equal(0, (await CreateService(check).BalanceAsync("user", default)).Available);
    }

    [Fact]
    public async Task RequestReplayReturnsSavedResultWithoutCallingProviderAgain()
    {
        using var db = CreateDb();
        await SeedUser(db);
        var credits = CreateService(db);
        await credits.GrantAsync("user", "grant", "manual", 2, null, default);
        var calls = 0;
        Task<(string, int)> Generate(CancellationToken _) { calls++; return Task.FromResult(("saved story", 1)); }
        var first = await CreditGeneration.RunAsync(credits, "user", "same", "number-peg-text", "apple", 1, Generate, default);
        var second = await CreditGeneration.RunAsync(credits, "user", "same", "number-peg-text", "apple", 1, Generate, default);
        Assert.Equal(first, second);
        Assert.Equal(1, calls);
        await Assert.ThrowsAsync<ConflictAppException>(() => credits.ReserveAsync("user", "same", "number-peg-text", "banana", 1, default));
    }

    [Fact]
    public async Task ProviderFailureReleasesCreditsAndGrantReplayDoesNotMintTwice()
    {
        using var db = CreateDb();
        await SeedUser(db);
        var credits = CreateService(db);
        await credits.GrantAsync("user", "grant", "manual", 10, null, default);
        await credits.GrantAsync("user", "grant", "manual", 10, null, default);
        await Assert.ThrowsAsync<InvalidOperationException>(() => CreditGeneration.RunAsync<string>(credits, "user", "fail", "number-peg-text", "input", 5,
            _ => throw new InvalidOperationException("provider failed"), default));
        Assert.Equal(10, (await credits.BalanceAsync("user", default)).Available);
        Assert.Equal("failed", (await db.AiGenerations.SingleAsync()).Status);
        await Assert.ThrowsAsync<ConflictAppException>(() => credits.GrantAsync("user", "grant", "manual", 11, null, default));
    }

    [Fact]
    public async Task AbandonedReservationIsReleasedAndExpiredGrantDoesNotBecomeSpendable()
    {
        using var db = CreateDb();
        await SeedUser(db);
        var credits = CreateService(db);
        await credits.GrantAsync("user", "month", "subscription", 10, DateTime.UtcNow.AddDays(1), default);
        var job = await credits.ReserveAsync("user", "abandoned", "palace-text", "input", 5, default);
        (await db.AiGenerations.SingleAsync()).LeaseExpiresAt = DateTime.UtcNow.AddMinutes(-1);
        (await db.AiCreditGrants.SingleAsync()).ExpiresAt = DateTime.UtcNow.AddMinutes(-1);
        await db.SaveChangesAsync();
        await credits.ReconcileAsync("user", default);
        Assert.Equal(0, (await credits.BalanceAsync("user", default)).Available);
        Assert.Equal("failed", (await db.AiGenerations.SingleAsync()).Status);
        Assert.Equal(0, await db.AiCreditEntries.SumAsync(x => x.Amount));
        await Assert.ThrowsAsync<ConflictAppException>(() => credits.CompleteAsync("user", job.Id, 5, "late", null, default));
    }

    [Fact]
    public async Task TemplateProviderWorksWithoutBalanceAndMissingImageProviderCannotReserve()
    {
        using var db = CreateDb();
        await SeedUser(db);
        var credits = CreateService(db, paid: false);
        await CreditGeneration.RunAsync(credits, "user", "template", "palace-text", "input", 10,
            _ => Task.FromResult(("free", 0)), default);
        Assert.Equal(0, (await db.AiGenerations.SingleAsync()).Charged);
        var error = await Assert.ThrowsAsync<AppException>(() => credits.ReserveAsync("user", "image", "number-peg-image", "input", 1, default));
        Assert.Equal(503, error.StatusCode);
        Assert.Single(await db.AiGenerations.ToListAsync());
    }

    [Fact]
    public async Task InsufficientBalancePreventsProviderInvocation()
    {
        using var db = CreateDb();
        await SeedUser(db);
        var calls = 0;
        var error = await Assert.ThrowsAsync<AppException>(() => CreditGeneration.RunAsync(CreateService(db), "user", "request", "palace-text", "input", 1,
            _ => { calls++; return Task.FromResult(("story", 1)); }, default));
        Assert.Equal(402, error.StatusCode);
        Assert.Equal(0, calls);
    }

    [Fact]
    public async Task PriceIncreaseBeyondConfirmedAmountDoesNotReserveCredits()
    {
        using var db = CreateDb();
        await SeedUser(db);
        var credits = CreateService(db);
        await credits.GrantAsync("user", "grant", "manual", 10, null, default);
        await Assert.ThrowsAsync<ConflictAppException>(() => credits.ReserveAsync("user", "quote", "palace-text", "input", 2, default, maxCredits: 1));
        Assert.Equal(10, (await credits.BalanceAsync("user", default)).Available);
        Assert.Empty(await db.AiGenerations.ToListAsync());
    }
}
