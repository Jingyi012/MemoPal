using Mapster;
using MediatR;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Configs.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Configs.Queries;

public sealed record GetXpConfigsQuery() : IRequest<IReadOnlyList<XpConfigDto>>;

public sealed class GetXpConfigsQueryHandler : IRequestHandler<GetXpConfigsQuery, IReadOnlyList<XpConfigDto>>
{
    private readonly IAppDbContext _db;

    public GetXpConfigsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<XpConfigDto>> Handle(GetXpConfigsQuery request, CancellationToken cancellationToken)
    {
        var data = await _db.XpConfigs
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.SourceType)
            .ToListAsync(cancellationToken);
        return data.Select(x => x.Adapt<XpConfigDto>()).ToList();
    }
}

