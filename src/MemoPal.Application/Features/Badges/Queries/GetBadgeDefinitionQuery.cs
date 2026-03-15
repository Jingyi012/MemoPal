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

public sealed record GetPagedBadgeDefinitionsQuery(int PageNumber = 1, int PageSize = 10, string? Search = null) : IRequest<PaginatedResponse<BadgeDefinitionDto>>;

public sealed class GetPagedBadgeDefinitionsQueryHandler : IRequestHandler<GetPagedBadgeDefinitionsQuery, PaginatedResponse<BadgeDefinitionDto>>
{
    private readonly IAppDbContext _db;

    public GetPagedBadgeDefinitionsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<PaginatedResponse<BadgeDefinitionDto>> Handle(GetPagedBadgeDefinitionsQuery request, CancellationToken cancellationToken)
    {
        var pageNumber = request.PageNumber <= 0 ? 1 : request.PageNumber;
        var pageSize = request.PageSize <= 0 ? 10 : Math.Min(request.PageSize, 200);

        var query = _db.BadgeDefinitions
            .Where(x => !x.IsDeleted)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(x => x.Key.Contains(search) || x.Name.Contains(search));
        }

        query = query.OrderBy(x => x.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);
        var data = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return PaginatedResponse<BadgeDefinitionDto>.Ok(
            data.Select(x => x.Adapt<BadgeDefinitionDto>()).ToList(),
            pageNumber,
            pageSize,
            totalCount);
    }
}

