using System.Text.Json;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace MemoPal.Infrastructure.AI;

public sealed class AiImageWorker(IServiceScopeFactory scopes, ILogger<AiImageWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessNextAsync(stoppingToken);
                await Task.Delay(TimeSpan.FromSeconds(3), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception ex)
            {
                logger.LogWarning("AI image worker failed. ReasonType={ReasonType}", ex.GetType().Name);
                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            }
        }
    }

    public async Task ProcessNextAsync(CancellationToken ct)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var credits = scope.ServiceProvider.GetRequiredService<AiCreditService>();
        var now = DateTime.UtcNow;
        var expiredUsers = await db.AiGenerations.AsNoTracking().Where(x =>
            (x.Status == "reserved" || x.Status == "processing") && x.LeaseExpiresAt <= now)
            .Select(x => x.UserId)
            .Union(db.AiCreditGrants.Where(x => x.Remaining > 0 && x.ExpiresAt <= now).Select(x => x.UserId))
            .Take(20).ToListAsync(ct);
        foreach (var user in expiredUsers) await credits.ReconcileAsync(user, ct);
        var candidate = await db.AiGenerations.AsNoTracking().Where(x => x.Kind == "number-peg-image" && x.Status == "reserved")
            .OrderBy(x => x.CreatedAt).Select(x => new { x.Id, x.UserId }).FirstOrDefaultAsync(ct);
        if (candidate is null) return;
        var input = await credits.LockedAsync(candidate.UserId, async () =>
        {
            var job = await db.AiGenerations.SingleAsync(x => x.Id == candidate.Id, ct);
            if (job.Status != "reserved" || job.LeaseExpiresAt <= DateTime.UtcNow) return null;
            job.Status = "processing";
            job.LeaseExpiresAt = DateTime.UtcNow.AddMinutes(5);
            return JsonSerializer.Deserialize<NumberPegImageInput>(job.InputJson!, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        }, ct);
        if (input is null) return;
        try
        {
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
            timeout.CancelAfter(TimeSpan.FromMinutes(3));
            var image = await scope.ServiceProvider.GetRequiredService<NumberPegImageGenerator>().GenerateAsync(input, timeout.Token);
            await credits.CompleteAsync(candidate.UserId, candidate.Id, 1,
                new { sceneAssetUrl = $"/v1/ai-credits/images/{candidate.Id}", input.Story }, image, CancellationToken.None);
        }
        catch (Exception ex)
        {
            await credits.FailAsync(candidate.UserId, candidate.Id, CancellationToken.None);
            logger.LogWarning(ex, "AI image generation failed. ReasonType={ReasonType} Error={Error}",
                ex.GetType().Name, ex.Message);
        }
    }
}
