using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Users.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Users.Commands;

public sealed record UpdateUserStatsCommand(string UserId, UpdateUserStatsRequest Request) : IRequest<ApiResponse<UserStatsDto>>;

public sealed class UpdateUserStatsCommandHandler : IRequestHandler<UpdateUserStatsCommand, ApiResponse<UserStatsDto>>
{
    private readonly IAppDbContext _db;

    public UpdateUserStatsCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<UserStatsDto>> Handle(UpdateUserStatsCommand request, CancellationToken cancellationToken)
    {
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == request.UserId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("User not found.");

        var now = DateTime.UtcNow;
        var stats = await _db.UserStats.FirstOrDefaultAsync(x => x.UserId == request.UserId, cancellationToken);
        if (stats is null)
        {
            stats = new UserStats
            {
                UserId = request.UserId,
                CreatedAt = now
            };
            await _db.UserStats.AddAsync(stats, cancellationToken);
        }

        if (request.Request.LessonsCompleted.HasValue) stats.LessonsCompleted = request.Request.LessonsCompleted.Value;
        if (request.Request.WordsLearned.HasValue) stats.WordsLearned = request.Request.WordsLearned.Value;
        if (request.Request.CurrentStreak.HasValue) stats.CurrentStreak = request.Request.CurrentStreak.Value;
        if (request.Request.LongestStreak.HasValue) stats.LongestStreak = request.Request.LongestStreak.Value;
        if (request.Request.LastActiveDate.HasValue) stats.LastActiveDate = request.Request.LastActiveDate;
        stats.UpdatedAt = now;
        stats.IsDeleted = false;
        stats.DeletedAt = null;

        user.Level = await _db.ResolveLevelByXpAsync(user.TotalXp, cancellationToken);
        user.UpdatedAt = now;

        await _db.SaveChangesAsync(cancellationToken);
        var result = stats.Adapt<UserStatsDto>();
        return ApiResponse<UserStatsDto>.Ok(result);
    }
}
