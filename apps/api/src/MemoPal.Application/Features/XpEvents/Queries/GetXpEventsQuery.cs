using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.XpEvents.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.XpEvents.Queries;

public sealed record GetXpEventsQuery(string UserId, int? RecentDays = null)
    : IRequest<ApiResponse<IReadOnlyList<XpEventDto>>>;

public sealed class GetXpEventsQueryHandler
    : IRequestHandler<GetXpEventsQuery, ApiResponse<IReadOnlyList<XpEventDto>>>
{
    private readonly IAppDbContext _db;

    public GetXpEventsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<XpEventDto>>> Handle(
        GetXpEventsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _db.XpEvents
            .AsNoTracking()
            .Where(x => x.UserId == request.UserId && !x.IsDeleted);

        if (request.RecentDays is > 0)
        {
            var days = Math.Min(request.RecentDays.Value, 3650);
            var cutoff = DateTime.UtcNow.AddDays(-days);
            query = query.Where(x => x.CreatedAt >= cutoff);
        }

        var entities = await query
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
        var items = entities.Select(x => x.Adapt<XpEventDto>()).ToList();
        return ApiResponse<IReadOnlyList<XpEventDto>>.Ok(items);
    }
}
