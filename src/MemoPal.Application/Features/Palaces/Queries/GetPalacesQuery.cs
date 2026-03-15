using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Palaces.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Palaces.Queries;

public sealed record GetPalacesQuery(string UserId, bool Paginate = false, int PageNumber = 1, int PageSize = 20)
    : IRequest<PaginatedResponse<PalaceDto>>;

public sealed class GetPalacesQueryHandler : IRequestHandler<GetPalacesQuery, PaginatedResponse<PalaceDto>>
{
    private readonly IAppDbContext _db;

    public GetPalacesQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<PaginatedResponse<PalaceDto>> Handle(GetPalacesQuery request, CancellationToken cancellationToken)
    {
        var baseQuery = _db.Palaces
            .Where(x => !x.IsDeleted && (!x.IsCustom || x.CreatedBy == request.UserId))
            .OrderBy(x => x.CreatedAt)
            .AsQueryable();

        var totalCount = await baseQuery.CountAsync(cancellationToken);

        if (!request.Paginate)
        {
            var all = await baseQuery.ToListAsync(cancellationToken);
            var data = all.Select(x => x.Adapt<PalaceDto>()).ToList();
            return PaginatedResponse<PalaceDto>.Ok(data, 1, Math.Max(1, data.Count), data.Count);
        }

        var pageNumber = Math.Max(1, request.PageNumber);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);

        var paged = await baseQuery
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = paged.Select(x => x.Adapt<PalaceDto>()).ToList();
        return PaginatedResponse<PalaceDto>.Ok(items, pageNumber, pageSize, totalCount);
    }
}

