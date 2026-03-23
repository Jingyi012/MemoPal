using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Palaces.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Palaces.Queries;

public sealed record GetPalacesQuery(string UserId, int? PageNumber = null, int? PageSize = null, bool IsAdmin = false)
    : IRequest<ApiResponse<IReadOnlyList<PalaceDto>>>;

public sealed class GetPalacesQueryHandler : IRequestHandler<GetPalacesQuery, ApiResponse<IReadOnlyList<PalaceDto>>>
{
    private readonly IAppDbContext _db;

    public GetPalacesQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<PalaceDto>>> Handle(GetPalacesQuery request, CancellationToken cancellationToken)
    {
        var baseQuery = _db.Palaces
            .Where(x => !x.IsDeleted && (request.IsAdmin || !x.IsCustom || x.CreatedBy == request.UserId))
            .OrderBy(x => x.CreatedAt)
            .AsQueryable();

        var usePagination = request.PageNumber.HasValue && request.PageSize.HasValue;

        if (!usePagination)
        {
            var all = await baseQuery.ToListAsync(cancellationToken);
            var data = all.Select(x => x.Adapt<PalaceDto>()).ToList();
            return ApiResponse<IReadOnlyList<PalaceDto>>.Ok(data);
        }

        var totalCount = await baseQuery.CountAsync(cancellationToken);
        var pageNumber = Math.Max(1, request.PageNumber!.Value);
        var pageSize = Math.Clamp(request.PageSize!.Value, 1, 100);

        var paged = await baseQuery
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = paged.Select(x => x.Adapt<PalaceDto>()).ToList();
        return PaginatedResponse<PalaceDto>.Ok(items, pageNumber, pageSize, totalCount);
    }
}
