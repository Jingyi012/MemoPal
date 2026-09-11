using MemoPal.Application.Common.Exceptions;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.AI;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Npgsql;

namespace MemoPal.IntegrationTests;

public sealed class PostgresAiCreditTests
{
    [PostgresCreditFact]
    public async Task MigrationsAndIndependentConnectionsEnforceAtomicReservations()
    {
        var adminConnection = Environment.GetEnvironmentVariable("MEMOPAL_CREDIT_TEST_CONNECTION")!;
        var databaseName = "memopal_credit_test_" + Guid.NewGuid().ToString("N");
        await using var admin = new NpgsqlConnection(adminConnection);
        await admin.OpenAsync();
        // This identifier is generated locally; never use an externally supplied database name for cleanup.
        await using (var create = new NpgsqlCommand($"CREATE DATABASE \"{databaseName}\"", admin)) await create.ExecuteNonQueryAsync();
        try
        {
            var connection = new NpgsqlConnectionStringBuilder(adminConnection) { Database = databaseName }.ConnectionString;
            var dbOptions = new DbContextOptionsBuilder<AppDbContext>().UseNpgsql(connection, x => x.EnableRetryOnFailure()).Options;
            await using (var db = new AppDbContext(dbOptions))
            {
                await db.Database.MigrateAsync();
                db.Users.Add(new User { Id = "credits-user", Email = "credits@example.com", DisplayName = "Credit test" });
                await db.SaveChangesAsync();
                await Service(db).GrantAsync("credits-user", "initial", "manual", 2, null, default);
            }
            var outcomes = await Task.WhenAll(Enumerable.Range(0, 10).Select(async i =>
            {
                await using var db = new AppDbContext(dbOptions);
                try { await Service(db).ReserveAsync("credits-user", $"parallel-{i}", "palace-text", "input", 1, default); return true; }
                catch (AppException ex) when (ex.StatusCode == 402) { return false; }
            }));
            Assert.Equal(2, outcomes.Count(x => x));
            await using (var db = new AppDbContext(dbOptions))
            {
                Assert.Equal(0, (await Service(db).BalanceAsync("credits-user", default)).Available);
                Assert.Equal(2, await db.AiGenerations.CountAsync());
                await Service(db).GrantAsync("credits-user", "extra", "manual", 10, null, default);
            }
            var replays = await Task.WhenAll(Enumerable.Range(0, 8).Select(async _ =>
            {
                await using var db = new AppDbContext(dbOptions);
                return await Service(db).ReserveAsync("credits-user", "same-request", "palace-text", "input", 1, default);
            }));
            Assert.Single(replays, x => x.Status == "new");
            Assert.Single(replays.Select(x => x.Id).Distinct());
            await using var check = new AppDbContext(dbOptions);
            Assert.Equal(9, (await Service(check).BalanceAsync("credits-user", default)).Available);
        }
        finally
        {
            await using var drop = new NpgsqlCommand($"DROP DATABASE \"{databaseName}\" WITH (FORCE)", admin);
            await drop.ExecuteNonQueryAsync();
        }
    }

    private static AiCreditService Service(AppDbContext db) => new(db, Options.Create(new AiCreditOptions()),
        Options.Create(new PalaceAssociationGenerationOptions { Provider = "ollama" }), Options.Create(new AiImageGenerationOptions()));

    private sealed class PostgresCreditFactAttribute : FactAttribute
    {
        public PostgresCreditFactAttribute()
        {
            if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("MEMOPAL_CREDIT_TEST_CONNECTION")))
                Skip = "Set MEMOPAL_CREDIT_TEST_CONNECTION to a PostgreSQL server allowing creation of an isolated test database.";
        }
    }
}
