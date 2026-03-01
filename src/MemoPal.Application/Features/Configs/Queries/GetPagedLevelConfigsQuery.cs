using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Configs.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Configs.Queries;

public sealed record GetPagedLevelConfigsQuery(int PageNumber = 1, int PageSize = 10) : IRequest<PagedResult<LevelConfigDto>>;

public sealed class GetPagedLevelConfigsQueryHandler : IRequestHandler<GetPagedLevelConfigsQuery, PagedResult<LevelConfigDto>>
{
    private readonly IAppDbContext _db;

    public GetPagedLevelConfigsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<LevelConfigDto>> Handle(GetPagedLevelConfigsQuery request, CancellationToken cancellationToken)
    {
        var pageNumber = request.PageNumber <= 0 ? 1 : request.PageNumber;
        var pageSize = request.PageSize <= 0 ? 10 : Math.Min(request.PageSize, 200);

        var query = _db.LevelConfigs
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.Level)
            .AsNoTracking();

        var totalCount = await query.CountAsync(cancellationToken);
        var data = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<LevelConfigDto>(
            data.Select(x => x.Adapt<LevelConfigDto>()).ToList(),
            pageNumber,
            pageSize,
            totalCount);
    }
}
