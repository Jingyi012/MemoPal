using Mapster;
using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Locations.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Locations.Queries;

public sealed record GetLocationsByPalaceQuery(string UserId, string PalaceId) : IRequest<IReadOnlyList<LocationDto>>;

public sealed class GetLocationsByPalaceQueryHandler : IRequestHandler<GetLocationsByPalaceQuery, IReadOnlyList<LocationDto>>
{
    private readonly IAppDbContext _db;

    public GetLocationsByPalaceQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<LocationDto>> Handle(GetLocationsByPalaceQuery request, CancellationToken cancellationToken)
    {
        var palace = await _db.Palaces.FirstOrDefaultAsync(
            x => x.Id == request.PalaceId && !x.IsDeleted && (!x.IsCustom || x.CreatedBy == request.UserId),
            cancellationToken);

        if (palace is null)
        {
            throw new NotFoundAppException("Palace not found.");
        }

        var data = await _db.Locations
            .Where(x => x.PalaceId == request.PalaceId && !x.IsDeleted)
            .OrderBy(x => x.Position)
            .ToListAsync(cancellationToken);

        return data.Select(x => x.Adapt<LocationDto>()).ToList();
    }
}

