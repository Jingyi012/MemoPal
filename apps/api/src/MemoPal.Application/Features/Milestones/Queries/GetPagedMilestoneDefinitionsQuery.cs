using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Milestones.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Milestones.Queries;

public sealed record GetPagedMilestoneDefinitionsQuery(int PageNumber = 1, int PageSize = 10, string? Search = null)
    : IRequest<PaginatedResponse<MilestoneDefinitionDto>>;

public sealed class GetPagedMilestoneDefinitionsQueryHandler : IRequestHandler<GetPagedMilestoneDefinitionsQuery, PaginatedResponse<MilestoneDefinitionDto>>
{
    private readonly IAppDbContext _db;

    public GetPagedMilestoneDefinitionsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<PaginatedResponse<MilestoneDefinitionDto>> Handle(GetPagedMilestoneDefinitionsQuery request, CancellationToken cancellationToken)
    {
        var pageNumber = request.PageNumber <= 0 ? 1 : request.PageNumber;
        var pageSize = request.PageSize <= 0 ? 10 : Math.Min(request.PageSize, 200);

        var query = _db.MilestoneDefinitions
            .Where(x => !x.IsDeleted)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(x => x.Key.Contains(search) || x.Title.Contains(search));
        }

        query = query.OrderBy(x => x.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);
        var data = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return PaginatedResponse<MilestoneDefinitionDto>.Ok(
            data.Select(x => x.Adapt<MilestoneDefinitionDto>()).ToList(),
            pageNumber,
            pageSize,
            totalCount);
    }
}

