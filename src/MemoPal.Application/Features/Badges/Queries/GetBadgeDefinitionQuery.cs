using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Badges.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Badges.Queries;

public sealed record GetBadgeDefinitionQuery(string BadgeId) : IRequest<ApiResponse<BadgeDefinitionDto>>;

public sealed class GetBadgeDefinitionQueryHandler : IRequestHandler<GetBadgeDefinitionQuery, ApiResponse<BadgeDefinitionDto>>
{
    private readonly IAppDbContext _db;

    public GetBadgeDefinitionQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<BadgeDefinitionDto>> Handle(GetBadgeDefinitionQuery request, CancellationToken cancellationToken)
    {
        var entity = await _db.BadgeDefinitions
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.BadgeId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("Badge definition not found.");

        return ApiResponse<BadgeDefinitionDto>.Ok(entity.Adapt<BadgeDefinitionDto>());
    }
}

