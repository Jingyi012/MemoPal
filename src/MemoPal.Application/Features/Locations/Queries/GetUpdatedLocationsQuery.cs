using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Locations.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Locations.Queries;

public sealed record GetUpdatedLocationsQuery(string UserId, DateTime Since) : IRequest<ApiResponse<IReadOnlyList<LocationDto>>>;

public sealed class GetUpdatedLocationsQueryHandler : IRequestHandler<GetUpdatedLocationsQuery, ApiResponse<IReadOnlyList<LocationDto>>>
{
    private readonly IAppDbContext _db;

    public GetUpdatedLocationsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<LocationDto>>> Handle(GetUpdatedLocationsQuery request, CancellationToken cancellationToken)
    {
        var data = await _db.Locations
            .Where(x => x.UpdatedAt > request.Since)
            .Join(_db.Palaces,
                location => location.PalaceId,
                palace => palace.Id,
                (location, palace) => new { location, palace })
            .Where(x => !x.palace.IsCustom || x.palace.CreatedBy == request.UserId)
            .OrderBy(x => x.location.UpdatedAt)
            .Select(x => x.location)
            .ToListAsync(cancellationToken);

        return ApiResponse<IReadOnlyList<LocationDto>>.Ok(data.Select(x => x.Adapt<LocationDto>()).ToList());
    }
}




