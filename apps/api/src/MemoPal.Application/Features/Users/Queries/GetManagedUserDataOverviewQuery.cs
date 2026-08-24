using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Users.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Users.Queries;

public sealed record GetManagedUserDataOverviewQuery(string UserId) : IRequest<ApiResponse<ManagedUserDataOverviewDto>>;

public sealed class GetManagedUserDataOverviewQueryHandler : IRequestHandler<GetManagedUserDataOverviewQuery, ApiResponse<ManagedUserDataOverviewDto>>
{
    private readonly IAppDbContext _db;

    public GetManagedUserDataOverviewQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<ManagedUserDataOverviewDto>> Handle(GetManagedUserDataOverviewQuery request, CancellationToken cancellationToken)
    {
        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.UserId, cancellationToken);

        if (user is null)
        {
            return ApiResponse<ManagedUserDataOverviewDto>.Fail("User not found.");
        }

        var stats = await _db.UserStats
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == request.UserId, cancellationToken);

        var lessonIdsQuery = _db.Lessons
            .AsNoTracking()
            .Where(x => x.CreatedBy == request.UserId)
            .Select(x => x.Id);

        var relatedPalaceIdsQuery = _db.UserPalaces
            .AsNoTracking()
            .Where(x => x.UserId == request.UserId && !x.IsDeleted)
            .Select(x => x.PalaceId)
            .Union(
                _db.Lessons
                    .AsNoTracking()
                    .Where(x => x.CreatedBy == request.UserId)
                    .Select(x => x.PalaceId))
            .Distinct();

        var palaceCount = await relatedPalaceIdsQuery.CountAsync(cancellationToken);
        var lessonCount = await _db.Lessons.AsNoTracking().CountAsync(x => x.CreatedBy == request.UserId, cancellationToken);
        var wordCount = await _db.Words.AsNoTracking().CountAsync(x => lessonIdsQuery.Contains(x.LessonId), cancellationToken);
        var progressCount = await _db.LessonProgresses.AsNoTracking().CountAsync(x => x.UserId == request.UserId, cancellationToken);
        var reviewScheduleCount = await _db.ReviewSchedules.AsNoTracking().CountAsync(x => x.UserId == request.UserId, cancellationToken);
        var xpEventCount = await _db.XpEvents.AsNoTracking().CountAsync(x => x.UserId == request.UserId, cancellationToken);
        var badgeCount = await _db.UserBadges.AsNoTracking().CountAsync(x => x.UserId == request.UserId, cancellationToken);
        var milestoneCount = await _db.UserMilestones.AsNoTracking().CountAsync(x => x.UserId == request.UserId, cancellationToken);
        var notificationCount = await _db.Notifications.AsNoTracking().CountAsync(x => x.UserId == request.UserId, cancellationToken);
        var subscriptionCount = await _db.UserSubscriptions.AsNoTracking().CountAsync(x => x.UserId == request.UserId, cancellationToken);

        var data = new ManagedUserDataOverviewDto(
            user.Adapt<ManagedUserDto>(),
            stats is null
                ? null
                : new UserStatsDto(
                    stats.LessonsCompleted,
                    stats.WordsLearned,
                    stats.CurrentStreak,
                    stats.LongestStreak,
                    stats.LastActiveDate,
                    stats.UpdatedAt),
            new ManagedUserDataCountsDto(
                palaceCount,
                lessonCount,
                wordCount,
                progressCount,
                reviewScheduleCount,
                xpEventCount,
                badgeCount,
                milestoneCount,
                notificationCount,
                subscriptionCount));

        return ApiResponse<ManagedUserDataOverviewDto>.Ok(data.Adapt<ManagedUserDataOverviewDto>());
    }
}
