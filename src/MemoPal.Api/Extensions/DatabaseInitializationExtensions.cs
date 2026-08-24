using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Api.Extensions;

public static class DatabaseInitializationExtensions
{
    public static async Task ApplyDatabaseMigrationsAsync(
        this WebApplication app,
        CancellationToken cancellationToken = default)
    {
        if (!app.Configuration.GetValue("Database:ApplyMigrationsOnStartup", true))
        {
            app.Logger.LogInformation("Automatic database migration is disabled.");
            return;
        }

        await using var scope = app.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        if (!dbContext.Database.IsRelational())
        {
            await dbContext.Database.EnsureCreatedAsync(cancellationToken);
            return;
        }

        var pendingMigrations = (await dbContext.Database
                .GetPendingMigrationsAsync(cancellationToken))
            .ToArray();

        if (pendingMigrations.Length == 0)
        {
            app.Logger.LogInformation("Database schema is already current.");
            return;
        }

        app.Logger.LogInformation(
            "Applying {MigrationCount} database migration(s): {Migrations}",
            pendingMigrations.Length,
            string.Join(", ", pendingMigrations));

        await dbContext.Database.MigrateAsync(cancellationToken);
        app.Logger.LogInformation("Database migrations completed successfully.");
    }
}
