using System.Text.Json;
using System.Text.Json.Serialization;

namespace MemoPal.Application.Features.Leaderboards.DTOs;

public static class LeaderboardKinds
{
    public const string CommunityWeeklyRecall = "community-weekly-recall";
    public const string CommunityStreak = "community-streak";
    public const string FriendsWeeklyRecall = "friends-weekly-recall";
}

public static class LeaderboardTaskMetrics
{
    public const string DistinctRecallItems = "distinct-recall-items";
    public const string DistinctDueReviewItems = "distinct-due-review-items";
}

public sealed class LeaderboardScoringTaskDto
{
    public string Id { get; set; } = "daily-recall";
    public int SortOrder { get; set; } = 1;
    public string Metric { get; set; } = LeaderboardTaskMetrics.DistinctRecallItems;
    public int Threshold { get; set; } = 5;
    public int Points { get; set; } = 10;
    public string TitleEn { get; set; } = "Daily recall";
    public string TitleZh { get; set; } = "每日回忆";
}

public sealed class LeaderboardRewardTierDto
{
    public int RankFrom { get; set; } = 1;
    public int RankTo { get; set; } = 1;
    public int CreditsPerWinner { get; set; } = 1;
}

public sealed class LeaderboardRewardConfigDto
{
    public bool Enabled { get; set; } = true;
    public int WeeklyBudget { get; set; } = 5000;
    public int MinimumActiveDays { get; set; } = 3;
    public int ExpiryDays { get; set; } = 90;
    public IReadOnlyList<LeaderboardRewardTierDto> Tiers { get; set; } = CreateDefaultTiers();

    public static LeaderboardRewardConfigDto CreateDefault(bool enabled = true) => new()
    {
        Enabled = enabled,
        WeeklyBudget = 5000,
        MinimumActiveDays = 3,
        ExpiryDays = 90,
        Tiers = CreateDefaultTiers()
    };

    private static IReadOnlyList<LeaderboardRewardTierDto> CreateDefaultTiers() =>
    [
        new() { RankFrom = 1, RankTo = 1, CreditsPerWinner = 600 },
        new() { RankFrom = 2, RankTo = 3, CreditsPerWinner = 300 },
        new() { RankFrom = 4, RankTo = 10, CreditsPerWinner = 150 },
        new() { RankFrom = 11, RankTo = 25, CreditsPerWinner = 80 },
        new() { RankFrom = 26, RankTo = 50, CreditsPerWinner = 40 },
        new() { RankFrom = 51, RankTo = 100, CreditsPerWinner = 11 }
    ];
}

public sealed class LeaderboardBoardDefinitionDto
{
    public string Id { get; set; } = "community-weekly";
    public string Kind { get; set; } = LeaderboardKinds.CommunityWeeklyRecall;
    public bool Enabled { get; set; } = true;
    public int SortOrder { get; set; } = 1;
    public string TitleEn { get; set; } = "Weekly Recall Challenge";
    public string TitleZh { get; set; } = "本周回忆挑战";
    public string DescriptionEn { get; set; } = "Recall from memory and compare your progress anonymously.";
    public string DescriptionZh { get; set; } = "完成回忆练习，和社区玩家匿名比拼。";
    public IReadOnlyList<LeaderboardScoringTaskDto> Tasks { get; set; } = [];
    public LeaderboardRewardConfigDto? Rewards { get; set; }

    [JsonExtensionData]
    public Dictionary<string, JsonElement>? LegacyFields { get; set; }
}

public sealed class LeaderboardCatalogConfigDto
{
    public IReadOnlyList<LeaderboardBoardDefinitionDto> Boards { get; set; } = [];
}

public sealed class UpdateLeaderboardCatalogRequest
{
    public LeaderboardCatalogConfigDto? Config { get; set; }
}

public sealed record PublicLeaderboardCatalogDto(IReadOnlyList<LeaderboardBoardDefinitionDto> Boards);
