using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.MemorySets.Commands;

public sealed record DeleteMemorySetCommand(
    string UserId,
    string MemorySetId) : IRequest<ApiResponse<bool>>;

public sealed class DeleteMemorySetCommandHandler
    : IRequestHandler<DeleteMemorySetCommand, ApiResponse<bool>>
{
    private readonly IAppDbContext _db;

    public DeleteMemorySetCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<bool>> Handle(
        DeleteMemorySetCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await _db.ForUser(request.UserId)
            .FirstOrDefaultAsync(x => x.Id == request.MemorySetId, cancellationToken)
            ?? throw new NotFoundAppException("Memory set not found.");

        _db.MemorySets.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true);
    }
}
