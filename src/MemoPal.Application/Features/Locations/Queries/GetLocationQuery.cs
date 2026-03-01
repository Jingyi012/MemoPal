using Mapster;
using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Locations.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Locations.Queries;

public sealed record GetLocationQuery(string UserId, string LocationId) : IRequest<LocationDto>;

public sealed class GetLocationQueryHandler : IRequestHandler<GetLocationQuery, LocationDto>
{
    private readonly IAppDbContext _db;

    public GetLocationQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<LocationDto> Handle(GetLocationQuery request, CancellationToken cancellationToken)
    {
        var location = await _db.Locations.FirstOrDefaultAsync(x => x.Id == request.LocationId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("Location not found.");

        var palace = await _db.Palaces.FirstOrDefaultAsync(
            x => x.Id == location.PalaceId && !x.IsDeleted && (!x.IsCustom || x.CreatedBy == request.UserId),
            cancellationToken);
        if (palace is null)
        {
            throw new NotFoundAppException("Location not found.");
        }

        return location.Adapt<LocationDto>();
    }
}

