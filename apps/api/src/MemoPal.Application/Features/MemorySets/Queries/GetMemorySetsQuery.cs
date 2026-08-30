using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.MemorySets.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.MemorySets.Queries;

public sealed record GetMemorySetsQuery(string UserId) : IRequest<ApiResponse<IReadOnlyList<MemorySetDto>>>;

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
