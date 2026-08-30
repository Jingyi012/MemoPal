using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.MemorySets.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.MemorySets.Commands;

public sealed record SetMemorySetArchivedCommand(
    string UserId,
    string MemorySetId,
    bool IsArchived) : IRequest<ApiResponse<MemorySetDto>>;

public sealed class SetMemorySetArchivedCommandHandler
    : IRequestHandler<SetMemorySetArchivedCommand, ApiResponse<MemorySetDto>>
{
    private readonly IAppDbContext _db;

    public SetMemorySetArchivedCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<MemorySetDto>> Handle(
        SetMemorySetArchivedCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await _db.ForUser(request.UserId)
            .WithAggregate()
            .FirstOrDefaultAsync(x => x.Id == request.MemorySetId, cancellationToken)
            ?? throw new NotFoundAppException("Memory set not found.");

        var nextStatus = request.IsArchived
            ? MemorySetStatuses.Archived
            : MemorySetAggregate.CreateDuplicateRequest(entity).Status;

        if (entity.Status != nextStatus)
        {
            entity.Status = nextStatus;
            entity.Version += 1;
            await _db.SaveChangesAsync(cancellationToken);
        }

        return ApiResponse<MemorySetDto>.Ok(MemorySetAggregate.ToDto(entity));
    }
}
