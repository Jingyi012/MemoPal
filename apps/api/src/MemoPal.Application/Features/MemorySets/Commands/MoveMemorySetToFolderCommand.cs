using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.MemoryFolders.DTOs;
using MemoPal.Application.Features.MemorySets.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.MemorySets.Commands;

public sealed record MoveMemorySetToFolderCommand(
    string UserId,
    string MemorySetId,
    MoveMemorySetToFolderRequest Request) : IRequest<ApiResponse<MemorySetDto>>;

public sealed class MoveMemorySetToFolderCommandHandler(IAppDbContext db)
    : IRequestHandler<MoveMemorySetToFolderCommand, ApiResponse<MemorySetDto>>
{
    public async Task<ApiResponse<MemorySetDto>> Handle(
        MoveMemorySetToFolderCommand request,
        CancellationToken cancellationToken)
    {
        var memorySet = await db.MemorySets
            .Where(x => x.UserId == request.UserId && !x.IsDeleted)
            .WithAggregate()
            .FirstOrDefaultAsync(x => x.Id == request.MemorySetId, cancellationToken)
            ?? throw new NotFoundAppException("Memory set not found.");

        if (request.Request.FolderId is not null)
        {
            var folderExists = await db.MemoryFolders
                .AnyAsync(x => x.Id == request.Request.FolderId &&
                    x.UserId == request.UserId && !x.IsDeleted, cancellationToken);
            if (!folderExists)
                throw new NotFoundAppException("Memory folder not found.");
        }

        memorySet.MemoryFolderId = request.Request.FolderId;
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<MemorySetDto>.Ok(MemorySetAggregate.ToDto(memorySet));
    }
}
