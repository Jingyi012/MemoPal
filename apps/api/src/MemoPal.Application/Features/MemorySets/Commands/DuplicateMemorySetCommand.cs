using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.MemorySets.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.MemorySets.Commands;

public sealed record DuplicateMemorySetCommand(
    string UserId,
    string MemorySetId) : IRequest<ApiResponse<MemorySetDto>>;

public sealed class DuplicateMemorySetCommandHandler
    : IRequestHandler<DuplicateMemorySetCommand, ApiResponse<MemorySetDto>>
{
    private readonly IAppDbContext _db;

    public DuplicateMemorySetCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<MemorySetDto>> Handle(
        DuplicateMemorySetCommand request,
        CancellationToken cancellationToken)
    {
        var source = await _db.ForUser(request.UserId)
            .WithAggregate()
            .FirstOrDefaultAsync(x => x.Id == request.MemorySetId, cancellationToken)
            ?? throw new NotFoundAppException("Memory set not found.");

        var duplicateRequest = MemorySetAggregate.CreateDuplicateRequest(source);
        await MemorySetPalaceValidator.ValidateAsync(
            _db,
            request.UserId,
            duplicateRequest,
            cancellationToken);

        var duplicate = MemorySetAggregate.Create(request.UserId, duplicateRequest);
        await _db.MemorySets.AddAsync(duplicate, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        return ApiResponse<MemorySetDto>.Ok(MemorySetAggregate.ToDto(duplicate));
    }
}
