using MediatR;
using MemoPal.Application.Features.Leaderboards.Commands;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace MemoPal.Infrastructure.AI;

public sealed class LeaderboardRewardWorker(
    IServiceScopeFactory scopes,
    ILogger<LeaderboardRewardWorker> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopes.CreateScope();
                var sender = scope.ServiceProvider.GetRequiredService<ISender>();
                await sender.Send(new ProcessLeaderboardRewardsCommand(DateTime.UtcNow), stoppingToken);
                await Task.Delay(Interval, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogWarning("Leaderboard reward worker failed. ReasonType={ReasonType}", ex.GetType().Name);
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
            }
        }
    }
}
