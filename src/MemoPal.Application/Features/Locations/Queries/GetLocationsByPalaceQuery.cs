using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Locations.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Locations.Queries;

public sealed record GetLocationsByPalaceQuery(string UserId, string PalaceId, int? PageNumber = null, int? PageSize = null, bool IsAdmin = false) : IRequest<ApiResponse<IReadOnlyList<LocationDto>>>;

public sealed class GetLocationsByPalaceQueryHandler : IRequestHandler<GetLocationsByPalaceQuery, ApiResponse<IReadOnlyList<LocationDto>>>
{
    private readonly IAppDbContext _db;

    public GetLocationsByPalaceQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<LocationDto>>> Handle(GetLocationsByPalaceQuery request, CancellationToken cancellationToken)
    {
        var palace = await _db.Palaces.FirstOrDefaultAsync(
            x => x.Id == request.PalaceId && !x.IsDeleted && (request.IsAdmin || !x.IsCustom || x.CreatedBy == request.UserId),
            cancellationToken);

        if (palace is null)
        {
            throw new NotFoundAppException("Palace not found.");
        }

        var query = _db.Locations
            .Where(x => x.PalaceId == request.PalaceId && !x.IsDeleted)
            .OrderBy(x => x.Position)
            .AsQueryable();

        var usePagination = request.PageNumber.HasValue && request.PageSize.HasValue;

        if (!usePagination)
        {
            var locations = await query.ToListAsync(cancellationToken);
            return ApiResponse<IReadOnlyList<LocationDto>>.Ok(locations.Select(x => x.Adapt<LocationDto>()).ToList());
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var pageNumber = Math.Max(1, request.PageNumber!.Value);
        var pageSize = Math.Clamp(request.PageSize!.Value, 1, 100);
        var paged = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);

        return PaginatedResponse<LocationDto>.Ok(paged.Select(x => x.Adapt<LocationDto>()).ToList(), pageNumber, pageSize, totalCount);
    }
}
