using MemoPal.Application.Common.Interfaces;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace MemoPal.Infrastructure.Storage;

public sealed class EducationAttachmentOrphanCleanupWorker(
    IServiceScopeFactory scopes,
    IPrivateAttachmentStorage storage,
    ILogger<EducationAttachmentOrphanCleanupWorker> logger) : BackgroundService
{
    private static readonly TimeSpan OrphanGracePeriod = TimeSpan.FromHours(24);
    private static readonly TimeSpan CleanupInterval = TimeSpan.FromHours(6);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupOnceAsync(DateTime.UtcNow, stoppingToken);
                await Task.Delay(CleanupInterval, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception ex)
            {
                logger.LogWarning("Education attachment orphan cleanup failed. ReasonType={ReasonType}", ex.GetType().Name);
                await Task.Delay(TimeSpan.FromMinutes(10), stoppingToken);
            }
        }
    }

    public async Task<int> CleanupOnceAsync(DateTime nowUtc, CancellationToken cancellationToken = default)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var referencedKeys = await db.EducationAssessmentAttachments.AsNoTracking()
            .Select(x => x.StorageKey)
            .ToHashSetAsync(cancellationToken);
        var deleted = await storage.DeleteOrphanedFilesAsync(referencedKeys, nowUtc - OrphanGracePeriod, cancellationToken);
        if (deleted > 0) logger.LogInformation("Removed unreferenced education attachment files. Count={Count}", deleted);
        return deleted;
    }
}
