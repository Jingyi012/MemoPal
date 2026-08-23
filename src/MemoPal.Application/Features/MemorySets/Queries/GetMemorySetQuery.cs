using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.MemorySets.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.MemorySets.Queries;

public sealed record GetMemorySetQuery(
    string UserId,
    string MemorySetId) : IRequest<ApiResponse<MemorySetDto>>;

public sealed class GetMemorySetQueryHandler
    : IRequestHandler<GetMemorySetQuery, ApiResponse<MemorySetDto>>
{
    private readonly IAppDbContext _db;

    public GetMemorySetQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<MemorySetDto>> Handle(
        GetMemorySetQuery request,
        CancellationToken cancellationToken)
    {
        var entity = await _db.ForUser(request.UserId)
            .WithAggregate()
            .FirstOrDefaultAsync(x => x.Id == request.MemorySetId, cancellationToken)
            ?? throw new NotFoundAppException("Memory set not found.");

        return ApiResponse<MemorySetDto>.Ok(MemorySetAggregate.ToDto(entity));
    }
}
