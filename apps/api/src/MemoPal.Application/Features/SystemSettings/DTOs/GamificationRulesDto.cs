namespace MemoPal.Application.Features.SystemSettings.DTOs;

public sealed record GamificationRulesDto(
    int MemoryLearnedXp,
    int DueReviewXp,
    int ExtraPracticeXp,
    int ExtraPracticeDailyLimit,
    int XpPerLevel);
