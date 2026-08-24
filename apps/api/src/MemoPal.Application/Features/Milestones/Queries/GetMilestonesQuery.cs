using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Milestones.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Milestones.Queries;

public sealed record GetMilestonesQuery(string UserId) : IRequest<ApiResponse<IReadOnlyList<MilestoneDto>>>;

public sealed class GetMilestonesQueryHandler : IRequestHandler<GetMilestonesQuery, ApiResponse<IReadOnlyList<MilestoneDto>>>
{
    private readonly IAppDbContext _db;

    public GetMilestonesQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<MilestoneDto>>> Handle(GetMilestonesQuery request, CancellationToken cancellationToken)
    {
        var defs = await _db.MilestoneDefinitions
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.UserId && !x.IsDeleted, cancellationToken);
        var userStats = await _db.UserStats
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == request.UserId && !x.IsDeleted, cancellationToken);

        var userMilestones = await _db.UserMilestones
            .Where(x => x.UserId == request.UserId && !x.IsDeleted)
            .ToListAsync(cancellationToken);
        var map = userMilestones.ToDictionary(x => x.MilestoneId, x => x);

        if (user is not null)
        {
            var now = DateTime.UtcNow;
            var hasNewAchievements = false;

            foreach (var definition in defs)
            {
                if (map.ContainsKey(definition.Id))
                {
                    continue;
                }

                if (!MilestoneAchievementEvaluator.IsAchieved(definition, user, userStats))
                {
                    continue;
                }

                var entity = new UserMilestone
                {
                    Id = Guid.NewGuid().ToString("D"),
                    UserId = request.UserId,
                    MilestoneId = definition.Id,
                    AchievedAt = now,
                    CreatedAt = now,
                    UpdatedAt = now,
                    IsDeleted = false
                };

                _db.UserMilestones.Add(entity);
                map[definition.Id] = entity;
                hasNewAchievements = true;
            }

            if (hasNewAchievements)
            {
                await _db.SaveChangesAsync(cancellationToken);
            }
        }

        var items = defs.Select(d =>
        {
            map.TryGetValue(d.Id, out var achieved);
            return ToMilestoneDto(d, achieved);
        }).ToList();
        return ApiResponse<IReadOnlyList<MilestoneDto>>.Ok(items);
    }

    private static MilestoneDto ToMilestoneDto(MilestoneDefinition definition, UserMilestone? achieved)
    {
        return new MilestoneDto(
            definition.Id,
            definition.Key,
            definition.Title,
            definition.Description,
            definition.ConditionType,
            definition.ConditionValue,
            achieved?.AchievedAt,
            definition.CreatedAt,
            definition.UpdatedAt,
            definition.IsDeleted,
            definition.DeletedAt);
    }
}
