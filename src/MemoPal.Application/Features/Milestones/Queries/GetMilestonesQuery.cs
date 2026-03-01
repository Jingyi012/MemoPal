using Mapster;
using MediatR;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Milestones.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Milestones.Queries;

public sealed record GetMilestonesQuery(string UserId) : IRequest<IReadOnlyList<MilestoneDto>>;

public sealed class GetMilestonesQueryHandler : IRequestHandler<GetMilestonesQuery, IReadOnlyList<MilestoneDto>>
{
    private readonly IAppDbContext _db;

    public GetMilestonesQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<MilestoneDto>> Handle(GetMilestonesQuery request, CancellationToken cancellationToken)
    {
        var defs = await _db.MilestoneDefinitions
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
        var userMilestones = await _db.UserMilestones
            .Where(x => x.UserId == request.UserId && !x.IsDeleted)
            .ToListAsync(cancellationToken);
        var map = userMilestones.ToDictionary(x => x.MilestoneId, x => x);

        return defs.Select(d =>
        {
            map.TryGetValue(d.Id, out var achieved);
            return (d, achieved).Adapt<MilestoneDto>();
        }).ToList();
    }
}

