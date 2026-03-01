using Mapster;
using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Configs.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Configs.Queries;

public sealed record GetXpConfigBySourceTypeQuery(string SourceType) : IRequest<XpConfigDto>;

public sealed class GetXpConfigBySourceTypeQueryHandler : IRequestHandler<GetXpConfigBySourceTypeQuery, XpConfigDto>
{
    private readonly IAppDbContext _db;

    public GetXpConfigBySourceTypeQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<XpConfigDto> Handle(GetXpConfigBySourceTypeQuery request, CancellationToken cancellationToken)
    {
        var data = await _db.XpConfigs.FirstOrDefaultAsync(
                x => x.SourceType == request.SourceType && !x.IsDeleted,
                cancellationToken)
            ?? throw new NotFoundAppException("XP config not found.");
        return data.Adapt<XpConfigDto>();
    }
}

