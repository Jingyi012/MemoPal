using Mapster;
using MediatR;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Users.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Users.Queries;

public sealed record GetUpdatedUserStatsQuery(string UserId, DateTime Since) : IRequest<IReadOnlyList<UserStatsDto>>;

public sealed class GetUpdatedUserStatsQueryHandler : IRequestHandler<GetUpdatedUserStatsQuery, IReadOnlyList<UserStatsDto>>
{
    private readonly IAppDbContext _db;

    public GetUpdatedUserStatsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<UserStatsDto>> Handle(GetUpdatedUserStatsQuery request, CancellationToken cancellationToken)
    {
        var data = await _db.UserStats
            .Where(x => x.UserId == request.UserId && x.UpdatedAt > request.Since)
            .OrderBy(x => x.UpdatedAt)
            .ToListAsync(cancellationToken);
        return data.Select(x => x.Adapt<UserStatsDto>()).ToList();
    }
}

