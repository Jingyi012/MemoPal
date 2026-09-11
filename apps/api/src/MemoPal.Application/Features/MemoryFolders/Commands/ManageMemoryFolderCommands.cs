using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.MemoryFolders.DTOs;
using MemoPal.Application.Features.MemoryFolders;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.MemoryFolders.Commands;

public sealed record CreateMemoryFolderCommand(
    string UserId,
    MemoryFolderRequest Request) : IRequest<ApiResponse<MemoryFolderDto>>;

public sealed record RenameMemoryFolderCommand(
    string UserId,
    string FolderId,
    MemoryFolderRequest Request) : IRequest<ApiResponse<MemoryFolderDto>>;

public sealed record DeleteMemoryFolderCommand(
    string UserId,
    string FolderId) : IRequest<ApiResponse<bool>>;

public sealed class CreateMemoryFolderCommandHandler(IAppDbContext db)
    : IRequestHandler<CreateMemoryFolderCommand, ApiResponse<MemoryFolderDto>>
{
    public async Task<ApiResponse<MemoryFolderDto>> Handle(
        CreateMemoryFolderCommand request,
        CancellationToken cancellationToken)
    {
        var name = NormalizeName(request.Request.Name);
        await EnsureNameAvailable(db, request.UserId, name, null, cancellationToken);

        var folder = new MemoryFolder { UserId = request.UserId, Name = name };
        await db.MemoryFolders.AddAsync(folder, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        return ApiResponse<MemoryFolderDto>.Ok(ToDto(folder));
    }

    internal static string NormalizeName(string? name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ValidationAppException("A folder name is required.");

        var normalized = name.Trim();
        if (normalized.Length > 200)
            throw new ValidationAppException("A folder name cannot exceed 200 characters.");

        return normalized;
    }

    internal static async Task EnsureNameAvailable(
        IAppDbContext db,
        string userId,
        string name,
        string? excludingFolderId,
        CancellationToken cancellationToken)
    {
        var exists = await db.ForUser(userId)
            .AnyAsync(x => x.Name == name && x.Id != excludingFolderId, cancellationToken);
        if (exists)
            throw new ConflictAppException("A folder with this name already exists.");
    }

    internal static MemoryFolderDto ToDto(MemoryFolder folder)
    {
        return new MemoryFolderDto(folder.Id, folder.Name, 0, 0, folder.CreatedAt, folder.UpdatedAt);
    }
}

public sealed class RenameMemoryFolderCommandHandler(IAppDbContext db)
    : IRequestHandler<RenameMemoryFolderCommand, ApiResponse<MemoryFolderDto>>
{
    public async Task<ApiResponse<MemoryFolderDto>> Handle(
        RenameMemoryFolderCommand request,
        CancellationToken cancellationToken)
    {
        var folder = await db.ForUser(request.UserId)
            .FirstOrDefaultAsync(x => x.Id == request.FolderId, cancellationToken)
            ?? throw new NotFoundAppException("Memory folder not found.");

        var name = CreateMemoryFolderCommandHandler.NormalizeName(request.Request.Name);
        await CreateMemoryFolderCommandHandler.EnsureNameAvailable(
            db, request.UserId, name, folder.Id, cancellationToken);

        folder.Name = name;
        await db.SaveChangesAsync(cancellationToken);

        // Counts are deliberately projected by the server rather than trusting the request.
        var summary = await db.ForUser(request.UserId)
            .Where(x => x.Id == folder.Id)
            .ProjectSummary()
            .SingleAsync(cancellationToken);
        return ApiResponse<MemoryFolderDto>.Ok(summary);
    }
}

public sealed class DeleteMemoryFolderCommandHandler(IAppDbContext db)
    : IRequestHandler<DeleteMemoryFolderCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(
        DeleteMemoryFolderCommand request,
        CancellationToken cancellationToken)
    {
        var folder = await db.ForUser(request.UserId)
            .FirstOrDefaultAsync(x => x.Id == request.FolderId, cancellationToken)
            ?? throw new NotFoundAppException("Memory folder not found.");

        var memorySets = await db.MemorySets
            .Where(x => x.UserId == request.UserId && !x.IsDeleted && x.MemoryFolderId == folder.Id)
            .ToListAsync(cancellationToken);
        foreach (var memorySet in memorySets)
        {
            memorySet.MemoryFolderId = null;
            memorySet.MemoryFolder = null;
        }

        db.MemoryFolders.Remove(folder);
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true);
    }
}
