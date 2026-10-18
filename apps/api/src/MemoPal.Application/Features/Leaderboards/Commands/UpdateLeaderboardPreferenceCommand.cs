using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Leaderboards.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Leaderboards.Commands;

public sealed record UpdateLeaderboardPreferenceCommand(string UserId, bool OptedIn)
    : IRequest<ApiResponse<LeaderboardPreferenceDto>>;

public sealed class UpdateLeaderboardPreferenceCommandHandler(IAppDbContext db)
    : IRequestHandler<UpdateLeaderboardPreferenceCommand, ApiResponse<LeaderboardPreferenceDto>>
{
    public async Task<ApiResponse<LeaderboardPreferenceDto>> Handle(
        UpdateLeaderboardPreferenceCommand request,
        CancellationToken cancellationToken)
    {
        var rawConfig = await db.SystemSettings.AsNoTracking()
            .Where(x => !x.IsDeleted && x.Key == SystemSettingKeys.LeaderboardCatalog)
            .Select(x => x.Value)
            .FirstOrDefaultAsync(cancellationToken);
        var currentBoard = LeaderboardCatalogSerializer.ParseOrDefault(rawConfig).Boards
            .Single(x => x.Id == "community-weekly");
        if (request.OptedIn && !currentBoard.Enabled)
            throw new NotFoundAppException("Leaderboard not found.");

        var now = DateTime.UtcNow;
        var season = await LeaderboardSeasonLifecycle.GetOrCreateCurrentAsync(
            db, currentBoard, now, cancellationToken);

        var user = await db.Users.FirstOrDefaultAsync(x => x.Id == request.UserId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("User not found.");

        if (request.OptedIn && (!user.CommunityLeaderboardOptIn || user.CommunityLeaderboardJoinedAtUtc is null))
        {
            user.CommunityLeaderboardOptIn = true;
            user.CommunityLeaderboardJoinedAtUtc = now;
        }
        else if (!request.OptedIn)
        {
            if (user.CommunityLeaderboardOptIn && user.CommunityLeaderboardJoinedAtUtc is { } joinedAt)
            {
                var participant = await LeaderboardSeasonLifecycle.EnsureParticipantAsync(
                    db, season, user.Id, joinedAt, now, cancellationToken);
                participant.OptedOutAtUtc = now;
            }
            user.CommunityLeaderboardOptIn = false;
            user.CommunityLeaderboardJoinedAtUtc = null;
        }

        if (request.OptedIn && user.CommunityLeaderboardOptIn && user.CommunityLeaderboardJoinedAtUtc is { } currentJoinedAt)
            await LeaderboardSeasonLifecycle.EnsureParticipantAsync(
                db, season, user.Id, currentJoinedAt, now, cancellationToken);

        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<LeaderboardPreferenceDto>.Ok(
            new LeaderboardPreferenceDto(user.CommunityLeaderboardOptIn, user.CommunityLeaderboardJoinedAtUtc));
    }
}
