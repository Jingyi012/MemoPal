using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Configs.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Configs.Queries;

public sealed record GetPagedXpConfigsQuery(int PageNumber = 1, int PageSize = 10) : IRequest<PaginatedResponse<XpConfigDto>>;

public sealed class GetPagedXpConfigsQueryHandler : IRequestHandler<GetPagedXpConfigsQuery, PaginatedResponse<XpConfigDto>>
{
    private readonly IAppDbContext _db;

    public GetPagedXpConfigsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<PaginatedResponse<XpConfigDto>> Handle(GetPagedXpConfigsQuery request, CancellationToken cancellationToken)
    {
        var pageNumber = request.PageNumber <= 0 ? 1 : request.PageNumber;
        var pageSize = request.PageSize <= 0 ? 10 : Math.Min(request.PageSize, 200);

        var query = _db.XpConfigs
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.SourceType)
            .AsNoTracking();

        var totalCount = await query.CountAsync(cancellationToken);
        var data = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return PaginatedResponse<XpConfigDto>.Ok(
            data.Select(x => x.Adapt<XpConfigDto>()).ToList(),
            pageNumber,
            pageSize,
            totalCount);
    }
}
