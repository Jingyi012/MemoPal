using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.MemorySets.DTOs;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.MemorySets.Commands;

public sealed record CreateMemorySetCommand(
    string UserId,
    MemorySetUpsertRequest Request) : IRequest<ApiResponse<MemorySetDto>>;

public sealed class CreateMemorySetCommandHandler
    : IRequestHandler<CreateMemorySetCommand, ApiResponse<MemorySetDto>>
{
    private readonly IAppDbContext _db;

    public CreateMemorySetCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<MemorySetDto>> Handle(
        CreateMemorySetCommand request,
        CancellationToken cancellationToken)
    {
        await AccountRestrictions.RequirePrivateAsync(_db, request.UserId, request.Request.Visibility, cancellationToken);
        var entity = await MemorySetCreation.BuildValidatedAsync(
            _db, request.UserId, request.Request, cancellationToken);
        await _db.MemorySets.AddAsync(entity, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<MemorySetDto>.Ok(MemorySetAggregate.ToDto(entity));
    }
}

/// <summary>Shared memory creation validation path, also used by education derivation.</summary>
public static class MemorySetCreation
{
    public static async Task<MemorySet> BuildValidatedAsync(
        IAppDbContext db,
        string userId,
        MemorySetUpsertRequest request,
        CancellationToken cancellationToken)
    {
        if (request.Visibility != MemorySetVisibilities.Private)
            throw new ValidationAppException("New memories must be private. Use the visibility endpoint after completing the memory.");
        if (request.MemoryFolderId is not null)
        {
            var folderExists = await db.MemoryFolders.AnyAsync(
                x => x.Id == request.MemoryFolderId && x.UserId == userId && !x.IsDeleted,
                cancellationToken);
            if (!folderExists) throw new NotFoundAppException("Memory folder not found.");
        }
        await MemorySetPalaceValidator.ValidateAsync(db, userId, request, cancellationToken);
        await MemorySetAiImageValidator.ValidateAsync(db, userId, request, cancellationToken);
        return MemorySetAggregate.Create(userId, request);
    }
}
