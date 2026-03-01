using Mapster;
using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Palaces.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Palaces.Queries;

public sealed record GetPalaceQuery(string UserId, string PalaceId) : IRequest<PalaceDto>;

public sealed class GetPalaceQueryHandler : IRequestHandler<GetPalaceQuery, PalaceDto>
{
    private readonly IAppDbContext _db;

    public GetPalaceQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<PalaceDto> Handle(GetPalaceQuery request, CancellationToken cancellationToken)
    {
        var palace = await _db.Palaces.FirstOrDefaultAsync(
                x => x.Id == request.PalaceId &&
                     !x.IsDeleted &&
                     (!x.IsCustom || x.CreatedBy == request.UserId),
                cancellationToken)
            ?? throw new NotFoundAppException("Palace not found.");

        return palace.Adapt<PalaceDto>();
    }
}

