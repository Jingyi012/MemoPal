using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Configs.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Configs.Queries;

public sealed record GetXpConfigsQuery() : IRequest<ApiResponse<IReadOnlyList<XpConfigDto>>>;

public sealed class GetXpConfigsQueryHandler : IRequestHandler<GetXpConfigsQuery, ApiResponse<IReadOnlyList<XpConfigDto>>>
{
    private readonly IAppDbContext _db;

    public GetXpConfigsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<XpConfigDto>>> Handle(GetXpConfigsQuery request, CancellationToken cancellationToken)
    {
        var data = await _db.XpConfigs
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.SourceType)
            .ToListAsync(cancellationToken);
        var items = data.Select(x => x.Adapt<XpConfigDto>()).ToList();
        return ApiResponse<IReadOnlyList<XpConfigDto>>.Ok(items);
    }
}

