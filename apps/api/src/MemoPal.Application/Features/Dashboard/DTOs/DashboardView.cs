namespace MemoPal.Application.Features.Dashboard.DTOs;

public sealed record DashboardView(
    int TotalUsers,
    int NewUsersLast7Days,
    int ActivePremiumUsers,
    int ReportedCommunityMemorySets,
    int DraftPredefinedLessons,
    int DraftPalaceScenes,
    int PastDueSubscriptions);
