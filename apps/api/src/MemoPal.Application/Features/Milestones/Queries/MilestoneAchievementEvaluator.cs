using MemoPal.Domain.Entities;

namespace MemoPal.Application.Features.Milestones.Queries;

internal static class MilestoneAchievementEvaluator
{
    public static bool IsAchieved(MilestoneDefinition definition, User user, UserStats? stats)
    {
        var conditionType = (definition.ConditionType ?? string.Empty).Trim().ToLowerInvariant();
        var targetValue = Math.Max(1, definition.ConditionValue);

        var completedLessons = Math.Max(0, stats?.LessonsCompleted ?? 0);
        var learnedWords = Math.Max(0, stats?.WordsLearned ?? 0);
        var currentStreak = Math.Max(0, stats?.CurrentStreak ?? 0);
        var longestStreak = Math.Max(0, stats?.LongestStreak ?? 0);
        var currentLevel = Math.Max(1, user.Level);
        var totalXp = Math.Max(0, user.TotalXp);

        return conditionType switch
        {
            "level" => currentLevel >= targetValue,
            "lessons_completed" => completedLessons >= targetValue,
            "words_learned" => learnedWords >= targetValue,
            "streak_days" => currentStreak >= targetValue,
            "longest_streak" => longestStreak >= targetValue,
            "xp_earned" => totalXp >= targetValue,
            "total_xp" => totalXp >= targetValue,
            _ => false
        };
    }
}
