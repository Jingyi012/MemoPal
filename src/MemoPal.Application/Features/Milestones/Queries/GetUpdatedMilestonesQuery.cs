using Mapster;
using MediatR;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Milestones.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Milestones.Queries;

public sealed record GetUpdatedMilestonesQuery(string UserId, DateTime Since) : IRequest<IReadOnlyList<MilestoneDto>>;

public sealed class GetUpdatedMilestonesQueryHandler : IRequestHandler<GetUpdatedMilestonesQuery, IReadOnlyList<MilestoneDto>>
{
    private readonly IAppDbContext _db;

    public GetUpdatedMilestonesQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<MilestoneDto>> Handle(GetUpdatedMilestonesQuery request, CancellationToken cancellationToken)
    {
        var defs = await _db.MilestoneDefinitions
            .Where(x => x.UpdatedAt > request.Since || !x.IsDeleted)
            .ToListAsync(cancellationToken);
        var userMilestones = await _db.UserMilestones
            .Where(x => x.UserId == request.UserId && (x.UpdatedAt > request.Since || !x.IsDeleted))
            .ToListAsync(cancellationToken);
        var map = userMilestones.ToDictionary(x => x.MilestoneId, x => x);

        return defs.Select(d =>
        {
            map.TryGetValue(d.Id, out var achieved);
            return (d, achieved).Adapt<MilestoneDto>();
        }).ToList();
    }
}

