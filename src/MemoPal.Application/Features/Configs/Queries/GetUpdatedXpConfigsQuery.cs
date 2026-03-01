using Mapster;
using MediatR;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Configs.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Configs.Queries;

public sealed record GetUpdatedXpConfigsQuery(DateTime Since) : IRequest<IReadOnlyList<XpConfigDto>>;

public sealed class GetUpdatedXpConfigsQueryHandler : IRequestHandler<GetUpdatedXpConfigsQuery, IReadOnlyList<XpConfigDto>>
{
    private readonly IAppDbContext _db;

    public GetUpdatedXpConfigsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<XpConfigDto>> Handle(GetUpdatedXpConfigsQuery request, CancellationToken cancellationToken)
    {
        var data = await _db.XpConfigs
            .Where(x => x.UpdatedAt > request.Since)
            .OrderBy(x => x.UpdatedAt)
            .ToListAsync(cancellationToken);
        return data.Select(x => x.Adapt<XpConfigDto>()).ToList();
    }
}

