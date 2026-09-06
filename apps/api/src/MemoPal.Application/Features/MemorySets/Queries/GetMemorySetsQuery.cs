using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.MemorySets.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.MemorySets.Queries;

public sealed record GetMemorySetsQuery(string UserId) : IRequest<ApiResponse<IReadOnlyList<MemorySetDto>>>;
public sealed record GetPagedMemorySetsQuery(string UserId, int PageNumber = 1, int PageSize = 20) : IRequest<PaginatedResponse<MemorySetDto>>;

public sealed class GetMemorySetsQueryHandler
    : IRequestHandler<GetMemorySetsQuery, ApiResponse<IReadOnlyList<MemorySetDto>>>
{
    private readonly IAppDbContext _db;

    public GetMemorySetsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<MemorySetDto>>> Handle(
        GetMemorySetsQuery request,
        CancellationToken cancellationToken)
    {
        var entities = await _db.ForUser(request.UserId)
            .WithAggregate()
            .OrderByDescending(x => x.UpdatedAt)
            .ToListAsync(cancellationToken);

        return ApiResponse<IReadOnlyList<MemorySetDto>>.Ok(
            entities.Select(MemorySetAggregate.ToDto).ToList());
    }
}

public sealed class GetPagedMemorySetsQueryHandler(IAppDbContext db)
    : IRequestHandler<GetPagedMemorySetsQuery, PaginatedResponse<MemorySetDto>>
{
    public async Task<PaginatedResponse<MemorySetDto>> Handle(GetPagedMemorySetsQuery request, CancellationToken cancellationToken)
    {
        var pageNumber = Math.Max(1, request.PageNumber);
        var pageSize = Math.Clamp(request.PageSize, 1, 50);
        var query = db.ForUser(request.UserId).WithAggregate().OrderByDescending(x => x.UpdatedAt);
        var totalCount = await query.CountAsync(cancellationToken);
        var entities = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        return PaginatedResponse<MemorySetDto>.Ok(entities.Select(MemorySetAggregate.ToDto).ToList(), pageNumber, pageSize, totalCount);
    }
}
