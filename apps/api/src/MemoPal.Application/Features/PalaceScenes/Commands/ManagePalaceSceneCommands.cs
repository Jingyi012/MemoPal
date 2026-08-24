using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.PalaceScenes.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.PalaceScenes.Commands;

public sealed record CreatePalaceSceneCommand(PalaceSceneUpsertRequest Request) : IRequest<ApiResponse<PalaceSceneDto>>;
public sealed record UpdatePalaceSceneCommand(string SceneId, PalaceSceneUpsertRequest Request) : IRequest<ApiResponse<PalaceSceneDto>>;
public sealed record DeletePalaceSceneCommand(string SceneId) : IRequest<ApiResponse<bool>>;
public sealed record CreateCustomPalaceSceneCommand(string UserId, PalaceSceneUpsertRequest Request) : IRequest<ApiResponse<PalaceSceneDto>>;
public sealed record UpdateCustomPalaceSceneCommand(string UserId, string SceneId, PalaceSceneUpsertRequest Request) : IRequest<ApiResponse<PalaceSceneDto>>;
public sealed record DeleteCustomPalaceSceneCommand(string UserId, string SceneId) : IRequest<ApiResponse<bool>>;

public sealed class CreatePalaceSceneCommandHandler(IAppDbContext db)
    : IRequestHandler<CreatePalaceSceneCommand, ApiResponse<PalaceSceneDto>>
{
    public async Task<ApiResponse<PalaceSceneDto>> Handle(CreatePalaceSceneCommand request, CancellationToken cancellationToken)
    {
        var scene = PalaceSceneAggregate.Create(request.Request);
        await db.PalaceScenes.AddAsync(scene, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<PalaceSceneDto>.Ok(PalaceSceneMapper.ToDto(scene));
    }
}

public sealed class UpdatePalaceSceneCommandHandler(IAppDbContext db)
    : IRequestHandler<UpdatePalaceSceneCommand, ApiResponse<PalaceSceneDto>>
{
    public async Task<ApiResponse<PalaceSceneDto>> Handle(UpdatePalaceSceneCommand request, CancellationToken cancellationToken)
    {
        var scene = await db.PalaceScenes.Include(x => x.Loci)
            .FirstOrDefaultAsync(x => x.Id == request.SceneId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("Palace scene not found.");
        if (request.Request.ExpectedVersion is null)
            throw new ValidationAppException("ExpectedVersion is required when updating a Palace scene.");
        if (request.Request.ExpectedVersion != scene.Version)
            throw new ConflictAppException($"This Palace scene changed. Reload version {scene.Version} before saving.");

        PalaceSceneAggregate.Update(scene, request.Request);
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<PalaceSceneDto>.Ok(PalaceSceneMapper.ToDto(scene));
    }
}

public sealed class DeletePalaceSceneCommandHandler(IAppDbContext db)
    : IRequestHandler<DeletePalaceSceneCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(DeletePalaceSceneCommand request, CancellationToken cancellationToken)
    {
        var scene = await db.PalaceScenes.Include(x => x.Loci)
            .FirstOrDefaultAsync(x => x.Id == request.SceneId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("Palace scene not found.");
        if (await db.TechniquePlans.AnyAsync(x => x.PalaceSceneId == scene.Id && !x.IsDeleted, cancellationToken))
            throw new ConflictAppException("Archive this scene instead; it is used by an active memory set.");
        foreach (var locus in scene.Loci.Where(x => !x.IsDeleted)) db.PalaceLoci.Remove(locus);
        db.PalaceScenes.Remove(scene);
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true);
    }
}

public sealed class CreateCustomPalaceSceneCommandHandler(IAppDbContext db)
    : IRequestHandler<CreateCustomPalaceSceneCommand, ApiResponse<PalaceSceneDto>>
{
    public async Task<ApiResponse<PalaceSceneDto>> Handle(
        CreateCustomPalaceSceneCommand request,
        CancellationToken cancellationToken)
    {
        var user = await db.Users.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.UserId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("User account is unavailable.");
        var palaceLimit = await db.GetCustomPalaceLimitAsync(user.IsPremium, cancellationToken);
        var existingCount = await db.PalaceScenes.CountAsync(
            x => x.UserId == request.UserId && !x.IsTemplate && !x.IsDeleted,
            cancellationToken);
        if (existingCount >= palaceLimit)
            throw new ConflictAppException("Custom Palace limit reached. Upgrade your plan to create another Palace.");

        var locationLimit = await db.GetCustomLocationsPerPalaceLimitAsync(user.IsPremium, cancellationToken);
        if (request.Request.Loci.Count > locationLimit)
            throw new ValidationAppException($"This plan allows up to {locationLimit} loci in a custom Palace.");

        var scene = PalaceSceneAggregate.CreateCustom(request.UserId, request.Request);
        await db.PalaceScenes.AddAsync(scene, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<PalaceSceneDto>.Ok(PalaceSceneMapper.ToDto(scene));
    }
}

public sealed class UpdateCustomPalaceSceneCommandHandler(IAppDbContext db)
    : IRequestHandler<UpdateCustomPalaceSceneCommand, ApiResponse<PalaceSceneDto>>
{
    public async Task<ApiResponse<PalaceSceneDto>> Handle(
        UpdateCustomPalaceSceneCommand request,
        CancellationToken cancellationToken)
    {
        var scene = await db.PalaceScenes.Include(x => x.Loci)
            .FirstOrDefaultAsync(
                x => x.Id == request.SceneId && x.UserId == request.UserId && !x.IsTemplate && !x.IsDeleted,
                cancellationToken)
            ?? throw new NotFoundAppException("Custom Palace not found.");
        if (request.Request.ExpectedVersion is null)
            throw new ValidationAppException("ExpectedVersion is required when updating a custom Palace.");
        if (request.Request.ExpectedVersion != scene.Version)
            throw new ConflictAppException($"This Palace changed. Reload version {scene.Version} before saving.");

        var user = await db.Users.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.UserId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("User account is unavailable.");
        var locationLimit = await db.GetCustomLocationsPerPalaceLimitAsync(user.IsPremium, cancellationToken);
        if (request.Request.Loci.Count > locationLimit)
            throw new ValidationAppException($"This plan allows up to {locationLimit} loci in a custom Palace.");

        PalaceSceneAggregate.UpdateCustom(scene, request.Request);
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<PalaceSceneDto>.Ok(PalaceSceneMapper.ToDto(scene));
    }
}

public sealed class DeleteCustomPalaceSceneCommandHandler(IAppDbContext db)
    : IRequestHandler<DeleteCustomPalaceSceneCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(
        DeleteCustomPalaceSceneCommand request,
        CancellationToken cancellationToken)
    {
        var scene = await db.PalaceScenes.Include(x => x.Loci)
            .FirstOrDefaultAsync(
                x => x.Id == request.SceneId && x.UserId == request.UserId && !x.IsTemplate && !x.IsDeleted,
                cancellationToken)
            ?? throw new NotFoundAppException("Custom Palace not found.");
        if (await db.TechniquePlans.AnyAsync(x => x.PalaceSceneId == scene.Id && !x.IsDeleted, cancellationToken))
            throw new ConflictAppException("This Palace is used by a memory. Archive it after that memory is finished.");

        foreach (var locus in scene.Loci.Where(x => !x.IsDeleted)) db.PalaceLoci.Remove(locus);
        db.PalaceScenes.Remove(scene);
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true);
    }
}
