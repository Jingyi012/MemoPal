using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Milestones.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Milestones.Queries;

public sealed record GetMilestoneQuery(string UserId, string MilestoneId) : IRequest<ApiResponse<MilestoneDto>>;

public sealed class GetMilestoneQueryHandler : IRequestHandler<GetMilestoneQuery, ApiResponse<MilestoneDto>>
{
    private readonly IAppDbContext _db;

    public GetMilestoneQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<MilestoneDto>> Handle(GetMilestoneQuery request, CancellationToken cancellationToken)
    {
        var definition = await _db.MilestoneDefinitions.FirstOrDefaultAsync(
                x => x.Id == request.MilestoneId &&
                     !x.IsDeleted,
                cancellationToken)
            ?? throw new NotFoundAppException("Milestone not found.");

        var achieved = await _db.UserMilestones.FirstOrDefaultAsync(
            x => x.UserId == request.UserId && x.MilestoneId == request.MilestoneId && !x.IsDeleted,
            cancellationToken);

        if (achieved is null)
        {
            var user = await _db.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == request.UserId && !x.IsDeleted, cancellationToken);
            var userStats = await _db.UserStats
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.UserId == request.UserId && !x.IsDeleted, cancellationToken);

            if (user is not null && MilestoneAchievementEvaluator.IsAchieved(definition, user, userStats))
            {
                var now = DateTime.UtcNow;
                achieved = new UserMilestone
                {
                    Id = Guid.NewGuid().ToString("D"),
                    UserId = request.UserId,
                    MilestoneId = definition.Id,
                    AchievedAt = now,
                    CreatedAt = now,
                    UpdatedAt = now,
                    IsDeleted = false
                };

                _db.UserMilestones.Add(achieved);
                await _db.SaveChangesAsync(cancellationToken);
            }
        }

        return ApiResponse<MilestoneDto>.Ok(ToMilestoneDto(definition, achieved));
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




