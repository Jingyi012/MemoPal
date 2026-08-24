using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Milestones.Commands;

public sealed record AwardMilestoneCommand(string UserId, string MilestoneId) : IRequest<ApiResponse<bool>>;

public sealed class AwardMilestoneCommandHandler : IRequestHandler<AwardMilestoneCommand, ApiResponse<bool>>
{
    private readonly IAppDbContext _db;

    public AwardMilestoneCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<bool>> Handle(AwardMilestoneCommand request, CancellationToken cancellationToken)
    {
        var definition = await _db.MilestoneDefinitions.FirstOrDefaultAsync(
                x => x.Id == request.MilestoneId && !x.IsDeleted,
                cancellationToken)
            ?? throw new NotFoundAppException("Milestone not found.");

        var now = DateTime.UtcNow;
        var userMilestone = await _db.UserMilestones.FirstOrDefaultAsync(
            x => x.UserId == request.UserId && x.MilestoneId == request.MilestoneId,
            cancellationToken);

        if (userMilestone is null)
        {
            userMilestone = new UserMilestone
            {
                Id = Guid.NewGuid().ToString("D"),
                UserId = request.UserId,
                MilestoneId = request.MilestoneId,
                AchievedAt = now,
                CreatedAt = now,
                UpdatedAt = now
            };
            await _db.UserMilestones.AddAsync(userMilestone, cancellationToken);
        }
        else
        {
            userMilestone.AchievedAt ??= now;
            userMilestone.IsDeleted = false;
            userMilestone.DeletedAt = null;
            userMilestone.UpdatedAt = now;
        }

        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true);
    }
}
