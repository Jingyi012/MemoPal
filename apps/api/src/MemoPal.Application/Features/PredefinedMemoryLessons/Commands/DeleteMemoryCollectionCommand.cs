using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.PredefinedMemoryLessons.Commands;

public sealed record DeleteMemoryCollectionCommand(string CollectionId, int ExpectedVersion) : IRequest<ApiResponse<bool>>;

public sealed class DeleteMemoryCollectionCommandHandler(IAppDbContext db)
    : IRequestHandler<DeleteMemoryCollectionCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(DeleteMemoryCollectionCommand command, CancellationToken ct)
    {
        var collection = await db.PredefinedMemoryCollections
            .FirstOrDefaultAsync(x => x.Id == command.CollectionId && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("Collection not found.");
        if (collection.Version != command.ExpectedVersion)
            throw new ConflictAppException("This collection changed. Reload before deleting.");
        collection.Version++;
        db.PredefinedMemoryCollections.Remove(collection);
        await ContentLibraryPersistence.SaveChangesAsync(db, ct);
        return ApiResponse<bool>.Ok(true);
    }
}
