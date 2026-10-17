namespace MemoPal.Application.Common.Settings;

public static class SystemSettingKeys
{
    public const string FeatureLimits = "feature.limits";
    public const string SupportHelpFaq = "support.help_faq";
    public const string SupportPrivacyPolicy = "support.privacy_policy";
    public const string PremiumSubscription = "premium.subscription";
    public const string XpConfigs = "xp.configs";
    public const string LevelConfigs = "level.configs";
    public const string GrowthReferralProgramConfig = "growth.referral.program_config";
    public const string AuthLoginMethods = "auth.login_methods";
    public const string NumberPegDefinitions = "number-peg.definitions";
}

public static class SystemSettingDefaults
{
    public const int CustomPalacesFree = 0;
    public const int CustomPalacesPremium = 20;
    public const int CustomLessonsPerPalaceFree = 5;
    public const int CustomLessonsPerPalacePremium = 50;
    public const int CustomLocationsPerPalaceFree = 15;
    public const int CustomLocationsPerPalacePremium = 100;
    public const int CustomWordsPerLessonFree = 25;
    public const int CustomWordsPerLessonPremium = 200;
}

public sealed record LevelAvatarRewardConfig(
    string Id,
    int RequiredLevel,
    string TitleEn,
    string TitleZh,
    string DescriptionEn,
    string DescriptionZh,
    string Icon,
    string Emoji,
    string GradientStart,
    string GradientEnd);

public static class LevelProgressConfigDefaults
{
    public static IReadOnlyList<LevelAvatarRewardConfig> AvatarRewards { get; } =
    [
        new("apprentice", 1, "Memory Seedling", "记忆幼苗", "Your memory journey starts here.", "你的记忆旅程从这里开始。", "book", "🌱", "#6950CC", "#9B8CFF"),
        new("navigator", 3, "Path Navigator", "记忆导航者", "You are finding your rhythm.", "你正在找到自己的学习节奏。", "compass", "🧭", "#24718D", "#4FC0E8"),
        new("explorer", 5, "Spark Explorer", "灵感探索者", "Curiosity is becoming a habit.", "好奇心正在变成你的习惯。", "sparkles", "✨", "#F2A900", "#FFC93C"),
        new("architect", 8, "Mind Architect", "思维建筑师", "You are building a stronger memory palace.", "你正在建造更强大的记忆宫殿。", "business", "🏛️", "#3B9C70", "#75D8A6"),
        new("sage", 12, "Palace Sage", "宫殿贤者", "Your recall practice has real momentum.", "你的回忆练习已经形成了强大惯性。", "ribbon", "👑", "#C73565", "#FF6F91"),
    ];
}
