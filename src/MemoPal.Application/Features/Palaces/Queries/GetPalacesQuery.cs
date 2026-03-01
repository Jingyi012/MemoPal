using Mapster;
using MediatR;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Palaces.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Palaces.Queries;

public sealed record GetPalacesQuery(string UserId) : IRequest<IReadOnlyList<PalaceDto>>;

public sealed class GetPalacesQueryHandler : IRequestHandler<GetPalacesQuery, IReadOnlyList<PalaceDto>>
{
    private readonly IAppDbContext _db;

    public GetPalacesQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<PalaceDto>> Handle(GetPalacesQuery request, CancellationToken cancellationToken)
    {
        var palaces = await _db.Palaces
            .Where(x => !x.IsDeleted && (!x.IsCustom || x.CreatedBy == request.UserId))
            .OrderBy(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        return palaces.Select(x => x.Adapt<PalaceDto>()).ToList();
    }
}

