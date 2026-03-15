using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Palaces.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Palaces.Queries;

public sealed record GetUpdatedPalacesQuery(string UserId, DateTime Since) : IRequest<ApiResponse<IReadOnlyList<PalaceDto>>>;

public sealed class GetUpdatedPalacesQueryHandler : IRequestHandler<GetUpdatedPalacesQuery, ApiResponse<IReadOnlyList<PalaceDto>>>
{
    private readonly IAppDbContext _db;

    public GetUpdatedPalacesQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<PalaceDto>>> Handle(GetUpdatedPalacesQuery request, CancellationToken cancellationToken)
    {
        var palaces = await _db.Palaces
            .Where(x => x.UpdatedAt > request.Since && (!x.IsCustom || x.CreatedBy == request.UserId))
            .OrderBy(x => x.UpdatedAt)
            .ToListAsync(cancellationToken);

        return ApiResponse<IReadOnlyList<PalaceDto>>.Ok(palaces.Select(x => x.Adapt<PalaceDto>()).ToList());
    }
}

