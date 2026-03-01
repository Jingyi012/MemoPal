using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Milestones.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Milestones.Queries;

public sealed record GetMilestoneDefinitionQuery(string MilestoneId) : IRequest<MilestoneDefinitionDto>;

public sealed class GetMilestoneDefinitionQueryHandler : IRequestHandler<GetMilestoneDefinitionQuery, MilestoneDefinitionDto>
{
    private readonly IAppDbContext _db;

    public GetMilestoneDefinitionQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<MilestoneDefinitionDto> Handle(GetMilestoneDefinitionQuery request, CancellationToken cancellationToken)
    {
        var entity = await _db.MilestoneDefinitions
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.MilestoneId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("Milestone definition not found.");

        return entity.Adapt<MilestoneDefinitionDto>();
    }
}

public sealed record GetPagedMilestoneDefinitionsQuery(int PageNumber = 1, int PageSize = 10, string? Search = null) : IRequest<PagedResult<MilestoneDefinitionDto>>;

public sealed class GetPagedMilestoneDefinitionsQueryHandler : IRequestHandler<GetPagedMilestoneDefinitionsQuery, PagedResult<MilestoneDefinitionDto>>
{
    private readonly IAppDbContext _db;

    public GetPagedMilestoneDefinitionsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<MilestoneDefinitionDto>> Handle(GetPagedMilestoneDefinitionsQuery request, CancellationToken cancellationToken)
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

        return new PagedResult<MilestoneDefinitionDto>(
            data.Select(x => x.Adapt<MilestoneDefinitionDto>()).ToList(),
            pageNumber,
            pageSize,
            totalCount);
    }
}
