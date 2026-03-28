namespace MemoPal.Application.Common.Settings;

public static class SystemSettingKeys
{
    public const string FeatureLimits = "feature.limits";
    public const string GamificationMissionTemplates = "gamification.missions.templates";
    public const string GamificationMobileUiConfig = "gamification.mobile.ui_config";
    public const string XpConfigs = "xp.configs";
    public const string LevelConfigs = "level.configs";
    public const string GrowthReferralProgramConfig = "growth.referral.program_config";
    public const string AuthLoginMethods = "auth.login_methods";
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
