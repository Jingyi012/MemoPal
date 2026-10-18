using System.Text.Json;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Leaderboards;
using MemoPal.Application.Features.Leaderboards.Commands;
using MemoPal.Application.Features.Leaderboards.DTOs;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace MemoPal.UnitTests;

public sealed class LeaderboardRewardTests
{
    [Fact]
    public void Default_weekly_reward_schedule_allocates_exactly_five_thousand_credits()
    {
        var rewards = Assert.Single(LeaderboardCatalogSerializer.ParseOrDefault(null).Boards).Rewards!;

        Assert.True(rewards.Enabled);
        Assert.Equal(5000, rewards.WeeklyBudget);
        Assert.Equal(3, rewards.MinimumActiveDays);
        Assert.Equal(5000, rewards.Tiers.Sum(x => (x.RankTo - x.RankFrom + 1) * x.CreditsPerWinner));
        Assert.Equal((1, 1, 600), (rewards.Tiers[0].RankFrom, rewards.Tiers[0].RankTo, rewards.Tiers[0].CreditsPerWinner));
        Assert.Equal((51, 100, 11), (rewards.Tiers[^1].RankFrom, rewards.Tiers[^1].RankTo, rewards.Tiers[^1].CreditsPerWinner));
    }

    [Fact]
    public void Tied_players_share_occupied_rank_prizes_and_ineligible_players_receive_none()
    {
        var rewards = Assert.Single(LeaderboardCatalogSerializer.ParseOrDefault(null).Boards).Rewards!;
        var credits = LeaderboardRewardCalculator.CalculateCredits(
        [
            new("first", 100, 3),
            new("second", 80, 3),
            new("third", 80, 3),
            new("inactive", 10, 2),
        ], rewards);

        Assert.Equal(600, credits["first"]);
        Assert.Equal(300, credits["second"]);
        Assert.Equal(300, credits["third"]);
        Assert.Equal(0, credits["inactive"]);
    }

    [Fact]
    public void A_tie_across_different_prize_tiers_splits_the_combined_prize()
    {
        var rewards = Assert.Single(LeaderboardCatalogSerializer.ParseOrDefault(null).Boards).Rewards!;
        var credits = LeaderboardRewardCalculator.CalculateCredits(
        [new("one", 100, 3), new("two", 100, 3), new("three", 90, 3)], rewards);

        Assert.Equal(450, credits["one"]);
        Assert.Equal(450, credits["two"]);
        Assert.Equal(300, credits["three"]);
    }

    [Fact]
    public void Reward_tiers_cannot_exceed_the_configured_weekly_budget()
    {
        var config = LeaderboardCatalogSerializer.GetDefault();
        config.Boards.Single().Rewards!.WeeklyBudget = 4999;

        Assert.False(LeaderboardCatalogSerializer.TryNormalize(config, out _, out var error));
        Assert.Contains("weekly budget", error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Reward_settlement_retries_a_failed_grant_and_uses_the_same_idempotency_reference()
    {
        const string userId = "weekly-reward-user";
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        await using var db = new AppDbContext(options);
        var thisWeekStart = LeaderboardSeasonLifecycle.GetWeekStart(DateTime.UtcNow);
        var previousWeekStart = thisWeekStart.AddDays(-7);
        var previousWeekEnd = previousWeekStart.AddDays(7);
        var nowUtc = thisWeekStart.AddDays(15);
        var board = Assert.Single(LeaderboardCatalogSerializer.GetDefault().Boards);

        db.Users.Add(new User
        {
            Id = userId,
            Email = "weekly-reward-user@example.com",
            CommunityLeaderboardOptIn = true,
            CommunityLeaderboardJoinedAtUtc = previousWeekStart,
        });
        db.SystemSettings.Add(new SystemSetting
        {
            Key = MemoPal.Application.Common.Settings.SystemSettingKeys.LeaderboardCatalog,
            Value = LeaderboardCatalogSerializer.Serialize(LeaderboardCatalogSerializer.GetDefault()),
        });
        db.LeaderboardSeasons.Add(new LeaderboardSeason
        {
            Id = "previous-week-season",
            LeaderboardId = board.Id,
            WeekStartsAtUtc = previousWeekStart,
            WeekEndsAtUtc = previousWeekEnd,
            ConfigJson = JsonSerializer.Serialize(board, new JsonSerializerOptions(JsonSerializerDefaults.Web)),
            Status = LeaderboardSeasonStatuses.Open,
        });
        db.LeaderboardSeasonParticipants.Add(new LeaderboardSeasonParticipant
        {
            Id = "previous-week-participant",
            SeasonId = "previous-week-season",
            UserId = userId,
            JoinedAtUtc = previousWeekStart,
            RewardStatus = LeaderboardRewardStatuses.Open,
        });
        db.MemorySets.Add(new MemorySet { Id = "reward-set", UserId = userId, Title = "Reward set" });
        for (var day = 1; day <= 3; day++)
        {
            var completedAt = previousWeekStart.AddDays(day).AddHours(12);
            var attemptId = $"reward-attempt-{day}";
            db.PracticeAttempts.Add(new PracticeAttempt
            {
                Id = attemptId,
                UserId = userId,
                MemorySetId = "reward-set",
                ClientAttemptId = $"reward-client-{day}",
                Mode = PracticeModes.Recall,
                StartedAt = completedAt.AddMinutes(-5),
                CompletedAt = completedAt,
            });
            for (var item = 1; item <= 5; item++)
            {
                var itemId = $"reward-item-{day}-{item}";
                db.MemoryItems.Add(new MemoryItem { Id = itemId, MemorySetId = "reward-set", Position = item });
                db.PracticeResponses.Add(new PracticeResponse
                {
                    Id = $"reward-response-{day}-{item}",
                    PracticeAttemptId = attemptId,
                    MemoryItemId = itemId,
                    WasDueAtSubmission = true,
                });
            }
        }
        await db.SaveChangesAsync();

        var credits = new RecordingAiCredits { FailNextGrant = true };
        var handler = new ProcessLeaderboardRewardsCommandHandler(
            db, credits, NullLogger<ProcessLeaderboardRewardsCommandHandler>.Instance);

        await handler.Handle(new ProcessLeaderboardRewardsCommand(nowUtc), default);
        var failedParticipant = await db.LeaderboardSeasonParticipants.SingleAsync(x => x.Id == "previous-week-participant");
        Assert.Equal(LeaderboardRewardStatuses.Failed, failedParticipant.RewardStatus);
        Assert.Equal(1, failedParticipant.RewardAttempts);
        Assert.Equal(600, failedParticipant.RewardCredits);

        await handler.Handle(new ProcessLeaderboardRewardsCommand(nowUtc.AddMinutes(1)), default);
        var awardedParticipant = await db.LeaderboardSeasonParticipants.SingleAsync(x => x.Id == "previous-week-participant");
        var settledSeason = await db.LeaderboardSeasons.SingleAsync(x => x.Id == "previous-week-season");
        Assert.Equal(LeaderboardRewardStatuses.Awarded, awardedParticipant.RewardStatus);
        Assert.Equal(1, awardedParticipant.FinalRank);
        Assert.Equal(LeaderboardSeasonStatuses.Settled, settledSeason.Status);
        Assert.Equal(2, credits.References.Count);
        Assert.Equal(credits.References[0], credits.References[1]);
        Assert.StartsWith("leaderboard:community-weekly:", credits.References[0], StringComparison.Ordinal);
    }

    private sealed class RecordingAiCredits : IAiCredits
    {
        public bool FailNextGrant { get; set; }
        public List<string> References { get; } = [];

        public Task GrantAsync(string userId, string reference, string source, int amount, DateTime? expiresAt, CancellationToken ct)
        {
            References.Add(reference);
            if (FailNextGrant)
            {
                FailNextGrant = false;
                throw new InvalidOperationException("Transient grant failure.");
            }
            return Task.CompletedTask;
        }

        public Task<AiCreditBalance> BalanceAsync(string userId, CancellationToken ct) => throw new NotSupportedException();
        public Task<IReadOnlyList<AiCreditHistoryItem>> HistoryAsync(string userId, int skip, CancellationToken ct) => throw new NotSupportedException();
        public Task<IReadOnlyList<AiGenerationView>> GenerationsAsync(string userId, CancellationToken ct) => throw new NotSupportedException();
        public Task<AiCreditReservation> ReserveAsync(string userId, string requestId, string kind, object input, int count, CancellationToken ct, int? maxCredits = null) => throw new NotSupportedException();
        public Task CompleteAsync(string userId, string id, int successCount, object result, AiImageContent? image, CancellationToken ct) => throw new NotSupportedException();
        public Task FailAsync(string userId, string id, CancellationToken ct) => throw new NotSupportedException();
        public Task<AiImageContent> ImageAsync(string userId, string id, CancellationToken ct) => throw new NotSupportedException();
    }
}
