using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Dashboard.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Dashboard.Admin.Queries;

public sealed record GetDashboardQuery : IRequest<ApiResponse<DashboardView>>;

public sealed class GetDashboardQueryHandler(IAppDbContext db)
    : IRequestHandler<GetDashboardQuery, ApiResponse<DashboardView>>
{
    public async Task<ApiResponse<DashboardView>> Handle(
        GetDashboardQuery request,
        CancellationToken cancellationToken)
    {
        var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);

        var totalUsers = await db.Users.CountAsync(x => !x.IsDeleted, cancellationToken);
        var newUsersLast7Days = await db.Users.CountAsync(
            x => !x.IsDeleted && x.CreatedAt >= sevenDaysAgo,
            cancellationToken);
        var activePremiumUsers = await db.Users.CountAsync(
            x => !x.IsDeleted && x.IsPremium,
            cancellationToken);
        var reportedCommunityMemorySets = await db.MemorySets.CountAsync(
            x => !x.IsDeleted &&
                x.Visibility == MemorySetVisibilities.Public &&
                x.PublishedAt != null &&
                x.CommunityStatus == MemorySetCommunityStatuses.Visible &&
                x.Reports.Any(report => !report.IsDeleted),
            cancellationToken);
        var draftPredefinedLessons = await db.PredefinedMemoryLessons.CountAsync(
            x => !x.IsDeleted && !x.IsPublished,
            cancellationToken);
        var draftPalaceScenes = await db.PalaceScenes.CountAsync(
            x => !x.IsDeleted && x.IsTemplate && x.Status == PalaceSceneStatuses.Draft,
            cancellationToken);
        var pastDueSubscriptions = await db.UserSubscriptions.CountAsync(
            x => !x.IsDeleted && x.Status == "past_due",
            cancellationToken);

        return ApiResponse<DashboardView>.Ok(new DashboardView(
            totalUsers,
            newUsersLast7Days,
            activePremiumUsers,
            reportedCommunityMemorySets,
            draftPredefinedLessons,
            draftPalaceScenes,
            pastDueSubscriptions));
    }
}
