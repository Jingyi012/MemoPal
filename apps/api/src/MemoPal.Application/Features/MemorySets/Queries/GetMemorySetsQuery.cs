using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.MemorySets.DTOs;
using Microsoft.EntityFrameworkCore;
using MemoPal.Application.Common.Exceptions;

namespace MemoPal.Application.Features.MemorySets.Queries;

public sealed record GetMemorySetsQuery(string UserId) : IRequest<ApiResponse<IReadOnlyList<MemorySetDto>>>;
public sealed record GetPagedMemorySetsQuery(
    string UserId,
    int PageNumber = 1,
    int PageSize = 20,
    string? FolderId = null,
    bool Unfiled = false) : IRequest<PaginatedResponse<MemorySetDto>>;

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
        if (request.Unfiled && !string.IsNullOrWhiteSpace(request.FolderId))
            throw new ValidationAppException("Choose either a folder or unfiled memory sets, not both.");

        var pageNumber = Math.Max(1, request.PageNumber);
        var pageSize = Math.Clamp(request.PageSize, 1, 50);
        var query = db.ForUser(request.UserId);
        if (!string.IsNullOrWhiteSpace(request.FolderId))
        {
            var folderExists = await db.MemoryFolders.AnyAsync(
                x => x.Id == request.FolderId && x.UserId == request.UserId && !x.IsDeleted,
                cancellationToken);
            if (!folderExists)
                throw new NotFoundAppException("Memory folder not found.");

            query = query.Where(x => x.MemoryFolderId == request.FolderId);
        }
        else if (request.Unfiled)
        {
            query = query.Where(x => x.MemoryFolderId == null);
        }

        var aggregateQuery = query.WithAggregate().OrderByDescending(x => x.UpdatedAt);
        var totalCount = await aggregateQuery.CountAsync(cancellationToken);
        var entities = await aggregateQuery.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        return PaginatedResponse<MemorySetDto>.Ok(entities.Select(MemorySetAggregate.ToDto).ToList(), pageNumber, pageSize, totalCount);
    }
}
