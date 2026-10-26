using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.MemorySets.Commands;

public sealed record MemorySetSoftDeletingNotification(string MemorySetId) : INotification;

public sealed record DeleteMemorySetCommand(
    string UserId,
    string MemorySetId) : IRequest<ApiResponse<bool>>;

public sealed class DeleteMemorySetCommandHandler
    : IRequestHandler<DeleteMemorySetCommand, ApiResponse<bool>>
{
    private readonly IAppDbContext _db;

    private readonly IPublisher? _publisher;

    public DeleteMemorySetCommandHandler(IAppDbContext db, IPublisher? publisher = null)
    {
        _db = db;
        _publisher = publisher;
    }

    public async Task<ApiResponse<bool>> Handle(
        DeleteMemorySetCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await _db.ForUser(request.UserId)
            .FirstOrDefaultAsync(x => x.Id == request.MemorySetId, cancellationToken)
            ?? throw new NotFoundAppException("Memory set not found.");

        // Generic lifecycle notification keeps this feature unaware of optional source modules.
        if (_publisher is not null)
            await _publisher.Publish(new MemorySetSoftDeletingNotification(entity.Id), cancellationToken);

        _db.MemorySets.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true);
    }
}
