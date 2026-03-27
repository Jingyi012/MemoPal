namespace MemoPal.Application.Common.Settings;

public static class SystemSettingKeys
{
    public const string CustomPalacesFree = "limits.custom_palaces.free";
    public const string CustomPalacesPremium = "limits.custom_palaces.premium";
    public const string CustomLessonsPerPalaceFree = "limits.custom_lessons_per_palace.free";
    public const string CustomLessonsPerPalacePremium = "limits.custom_lessons_per_palace.premium";
    public const string CustomLocationsPerPalaceFree = "limits.custom_locations_per_palace.free";
    public const string CustomLocationsPerPalacePremium = "limits.custom_locations_per_palace.premium";
    public const string CustomWordsPerLessonFree = "limits.custom_words_per_lesson.free";
    public const string CustomWordsPerLessonPremium = "limits.custom_words_per_lesson.premium";
    public const string GamificationMissionTemplates = "gamification.missions.templates";
    public const string GamificationMobileUiConfig = "gamification.mobile.ui_config";
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
