using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Avatars.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Avatars.Queries;

public sealed record GetPagedAvatarDefinitionsQuery(int PageNumber = 1, int PageSize = 20, string? Search = null)
    : IRequest<PaginatedResponse<AvatarDefinitionDto>>;

public sealed class GetPagedAvatarDefinitionsQueryHandler : IRequestHandler<GetPagedAvatarDefinitionsQuery, PaginatedResponse<AvatarDefinitionDto>>
{
    private readonly IAppDbContext _db;

    public GetPagedAvatarDefinitionsQueryHandler(IAppDbContext db) => _db = db;

    public async Task<PaginatedResponse<AvatarDefinitionDto>> Handle(GetPagedAvatarDefinitionsQuery request, CancellationToken cancellationToken)
    {
        var pageNumber = Math.Max(1, request.PageNumber);
        var pageSize = Math.Clamp(request.PageSize, 1, 200);
        var query = _db.AvatarDefinitions.Where(x => !x.IsDeleted).AsNoTracking();
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(x => x.Key.Contains(search) || x.TitleEn.Contains(search) || x.TitleZh.Contains(search));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var entities = await query
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.RequiredLevel)
            .ThenBy(x => x.Key)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return PaginatedResponse<AvatarDefinitionDto>.Ok(
            entities.Select(x => x.Adapt<AvatarDefinitionDto>()).ToList(),
            pageNumber,
            pageSize,
            totalCount);
    }
}
