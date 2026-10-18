using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using MemoPal.Application.Features.Leaderboards.DTOs;

namespace MemoPal.Application.Features.Leaderboards;

public static class LeaderboardCatalogSerializer
{
    private const int MaxTitleLength = 80;
    private const int MaxDescriptionLength = 240;
    private const int MaxTasksPerBoard = 20;
    private const int MaxRewardTiers = 20;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public static LeaderboardCatalogConfigDto GetDefault() => new()
    {
        Boards = [new LeaderboardBoardDefinitionDto
        {
            Tasks = GetDefaultTasks(5, 10, 5, 5),
            Rewards = LeaderboardRewardConfigDto.CreateDefault()
        }]
    };

    public static LeaderboardCatalogConfigDto ParseOrDefault(string? rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue)) return GetDefault();

        try
        {
            var config = JsonSerializer.Deserialize<LeaderboardCatalogConfigDto>(rawValue, JsonOptions);
            UpgradeLegacyScoring(config);
            UpgradeMissingWeeklyTasks(config);
            return TryNormalize(config, out var normalized, out _) ? normalized : GetDefault();
        }
        catch (JsonException)
        {
            return GetDefault();
        }
    }

    public static string Serialize(LeaderboardCatalogConfigDto config) =>
        JsonSerializer.Serialize(config, JsonOptions);

    public static bool TryNormalize(
        LeaderboardCatalogConfigDto? config,
        out LeaderboardCatalogConfigDto normalized,
        out string error)
    {
        normalized = GetDefault();
        error = string.Empty;
        if (config?.Boards is null || config.Boards.Count is < 1 or > 50)
        {
            error = "Configure between 1 and 50 leaderboard entries.";
            return false;
        }

        var seenIds = new HashSet<string>(StringComparer.Ordinal);
        var normalizedBoards = new List<LeaderboardBoardDefinitionDto>();
        var hasCommunityWeeklyBoard = false;
        foreach (var board in config.Boards)
        {
            if (board is null || string.IsNullOrWhiteSpace(board.Id) || board.Id.Length > 64 ||
                !Regex.IsMatch(board.Id, "^[a-z0-9]+(?:-[a-z0-9]+)*$") || !seenIds.Add(board.Id))
            {
                error = "Leaderboard IDs must be unique lowercase slugs of up to 64 characters.";
                return false;
            }

            var isCommunityWeekly = string.Equals(board.Id, "community-weekly", StringComparison.Ordinal);
            if (isCommunityWeekly)
            {
                if (!string.Equals(board.Kind, LeaderboardKinds.CommunityWeeklyRecall, StringComparison.Ordinal))
                {
                    error = "The built-in community weekly leaderboard type cannot be changed.";
                    return false;
                }
                hasCommunityWeeklyBoard = true;
            }
            else if (string.Equals(board.Kind, LeaderboardKinds.CommunityWeeklyRecall, StringComparison.Ordinal))
            {
                error = "The community weekly recall processor can only be assigned to the built-in board.";
                return false;
            }
            else if (board.Kind is not (LeaderboardKinds.CommunityStreak or LeaderboardKinds.FriendsWeeklyRecall))
            {
                error = "Choose a supported leaderboard format.";
                return false;
            }

            if (board.Enabled && !isCommunityWeekly)
            {
                error = "This leaderboard format is a draft until its ranking processor is implemented.";
                return false;
            }

            var titleEn = CleanRequired(board.TitleEn, MaxTitleLength);
            var titleZh = CleanRequired(board.TitleZh, MaxTitleLength);
            var descriptionEn = CleanRequired(board.DescriptionEn, MaxDescriptionLength);
            var descriptionZh = CleanRequired(board.DescriptionZh, MaxDescriptionLength);
            if (titleEn is null || titleZh is null || descriptionEn is null || descriptionZh is null)
            {
                error = "English and Chinese titles and descriptions are required and must fit the length limits.";
                return false;
            }

            if (board.SortOrder is < 1 or > 1000 || board.Tasks is null || board.Tasks.Count > MaxTasksPerBoard)
            {
                error = "Display order or task count is outside the supported range.";
                return false;
            }

            var normalizedTasks = new List<LeaderboardScoringTaskDto>();
            var seenTaskIds = new HashSet<string>(StringComparer.Ordinal);
            foreach (var task in board.Tasks)
            {
                if (task is null || string.IsNullOrWhiteSpace(task.Id) || task.Id.Length > 64 ||
                    !Regex.IsMatch(task.Id, "^[a-z0-9]+(?:-[a-z0-9]+)*$") || !seenTaskIds.Add(task.Id))
                {
                    error = "Task IDs must be unique lowercase slugs of up to 64 characters.";
                    return false;
                }

                if (task.Metric is not (LeaderboardTaskMetrics.DistinctRecallItems or LeaderboardTaskMetrics.DistinctDueReviewItems) ||
                    task.SortOrder is < 1 or > 1000 || task.Threshold is < 1 or > 1000 || task.Points is < 0 or > 1000)
                {
                    error = "Choose a supported task metric and valid order, threshold, and reward.";
                    return false;
                }

                var taskTitleEn = CleanRequired(task.TitleEn, MaxTitleLength);
                var taskTitleZh = CleanRequired(task.TitleZh, MaxTitleLength);
                if (taskTitleEn is null || taskTitleZh is null)
                {
                    error = "Each task needs English and Chinese titles of up to 80 characters.";
                    return false;
                }

                normalizedTasks.Add(new LeaderboardScoringTaskDto
                {
                    Id = task.Id,
                    SortOrder = task.SortOrder,
                    Metric = task.Metric,
                    Threshold = task.Threshold,
                    Points = task.Points,
                    TitleEn = taskTitleEn,
                    TitleZh = taskTitleZh
                });
            }

            if (isCommunityWeekly && normalizedTasks.Count == 0)
            {
                error = "The built-in weekly leaderboard needs at least one scoring task.";
                return false;
            }

            var rewards = board.Rewards ?? LeaderboardRewardConfigDto.CreateDefault(isCommunityWeekly);
            if (rewards.WeeklyBudget is < 0 or > 1_000_000 ||
                rewards.MinimumActiveDays is < 1 or > 7 ||
                rewards.ExpiryDays is < 1 or > 365 ||
                rewards.Tiers is null || rewards.Tiers.Count is < 1 or > MaxRewardTiers)
            {
                error = "Reward budget, active-day requirement, expiry, or tier count is outside the supported range.";
                return false;
            }

            if (rewards.Tiers.Any(x => x is null))
            {
                error = "Reward tiers cannot contain empty entries.";
                return false;
            }

            var normalizedTiers = rewards.Tiers.OrderBy(x => x.RankFrom).ToArray();
            var expectedRank = 1;
            long maximumPayout = 0;
            foreach (var tier in normalizedTiers)
            {
                if (tier.RankFrom != expectedRank || tier.RankTo < tier.RankFrom ||
                    tier.RankTo > 100 || tier.CreditsPerWinner is < 1 or > 100_000)
                {
                    error = "Reward tiers must cover ranks 1–100 without gaps or overlaps and use valid credit amounts.";
                    return false;
                }

                expectedRank = tier.RankTo + 1;
                maximumPayout += (long)(tier.RankTo - tier.RankFrom + 1) * tier.CreditsPerWinner;
            }

            if (expectedRank != 101 || (rewards.Enabled && rewards.WeeklyBudget < 1) ||
                maximumPayout > rewards.WeeklyBudget)
            {
                error = "Reward tiers must cover ranks 1–100 and their maximum payout cannot exceed the weekly budget.";
                return false;
            }

            normalizedBoards.Add(new LeaderboardBoardDefinitionDto
            {
                Id = board.Id,
                Kind = board.Kind,
                Enabled = board.Enabled,
                SortOrder = board.SortOrder,
                TitleEn = titleEn,
                TitleZh = titleZh,
                DescriptionEn = descriptionEn,
                DescriptionZh = descriptionZh,
                Tasks = normalizedTasks.OrderBy(x => x.SortOrder).ThenBy(x => x.Id, StringComparer.Ordinal).ToArray(),
                Rewards = new LeaderboardRewardConfigDto
                {
                    Enabled = rewards.Enabled,
                    WeeklyBudget = rewards.WeeklyBudget,
                    MinimumActiveDays = rewards.MinimumActiveDays,
                    ExpiryDays = rewards.ExpiryDays,
                    Tiers = normalizedTiers.Select(x => new LeaderboardRewardTierDto
                    {
                        RankFrom = x.RankFrom,
                        RankTo = x.RankTo,
                        CreditsPerWinner = x.CreditsPerWinner
                    }).ToArray()
                }
            });
        }

        if (!hasCommunityWeeklyBoard)
        {
            error = "The built-in community weekly leaderboard cannot be removed.";
            return false;
        }

        normalized = new LeaderboardCatalogConfigDto
        {
            Boards = normalizedBoards.OrderBy(x => x.SortOrder).ThenBy(x => x.Id, StringComparer.Ordinal).ToArray()
        };
        return true;
    }

    private static string? CleanRequired(string? value, int maxLength)
    {
        var trimmed = value?.Trim();
        return string.IsNullOrWhiteSpace(trimmed) || trimmed.Length > maxLength ? null : trimmed;
    }

    private static void UpgradeLegacyScoring(LeaderboardCatalogConfigDto? config)
    {
        if (config?.Boards is null) return;

        foreach (var board in config.Boards)
        {
            if (board is null || board.Tasks is { Count: > 0 } || board.LegacyFields is null) continue;
            if (!TryGetLegacyInt(board.LegacyFields, "recallItemThreshold", out var recallThreshold) ||
                !TryGetLegacyInt(board.LegacyFields, "recallPoints", out var recallPoints) ||
                !TryGetLegacyInt(board.LegacyFields, "dueReviewItemThreshold", out var dueThreshold) ||
                !TryGetLegacyInt(board.LegacyFields, "dueReviewBonusPoints", out var duePoints)) continue;

            board.Tasks =
                GetDefaultTasks(recallThreshold, recallPoints, dueThreshold, duePoints);
        }
    }

    private static void UpgradeMissingWeeklyTasks(LeaderboardCatalogConfigDto? config)
    {
        if (config?.Boards is null) return;

        foreach (var board in config.Boards)
        {
            if (board is null || !string.Equals(board.Id, "community-weekly", StringComparison.Ordinal) ||
                board.Tasks is { Count: > 0 }) continue;

            board.Tasks = GetDefaultTasks(5, 10, 5, 5);
        }
    }

    private static IReadOnlyList<LeaderboardScoringTaskDto> GetDefaultTasks(
        int recallThreshold, int recallPoints, int dueThreshold, int duePoints) =>
    [
        new LeaderboardScoringTaskDto
        {
            Id = "daily-recall", SortOrder = 1, Metric = LeaderboardTaskMetrics.DistinctRecallItems,
            Threshold = recallThreshold, Points = recallPoints
        },
        new LeaderboardScoringTaskDto
        {
            Id = "due-review", SortOrder = 2, Metric = LeaderboardTaskMetrics.DistinctDueReviewItems,
            Threshold = dueThreshold, Points = duePoints, TitleEn = "Due-item recall", TitleZh = "到期项目回忆"
        }
    ];

    private static bool TryGetLegacyInt(IReadOnlyDictionary<string, JsonElement> fields, string name, out int value)
    {
        if (fields.TryGetValue(name, out var field) && field.TryGetInt32(out value)) return true;
        value = 0;
        return false;
    }
}
