using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Security;
using MemoPal.Application.Features.Locations.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Locations.Queries;

public sealed record GetLocationQuery(string UserId, string LocationId, bool IsAdmin = false) : IRequest<ApiResponse<LocationDto>>;

public sealed class GetLocationQueryHandler : IRequestHandler<GetLocationQuery, ApiResponse<LocationDto>>
{
    private readonly IAppDbContext _db;

    public GetLocationQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<LocationDto>> Handle(GetLocationQuery request, CancellationToken cancellationToken)
    {
        var location = await _db.Locations.FirstOrDefaultAsync(x => x.Id == request.LocationId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("Location not found.");

        var palace = await PalaceAccessPolicy.FindAccessiblePalaceAsync(
            _db,
            location.PalaceId,
            request.UserId,
            request.IsAdmin,
            cancellationToken);
        if (palace is null)
        {
            throw new NotFoundAppException("Location not found.");
        }

        return ApiResponse<LocationDto>.Ok(location.Adapt<LocationDto>());
    }
}




