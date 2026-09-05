using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.CommunityMemorySets.DTOs;
using MemoPal.Application.Features.CommunityMemorySets.Queries;
using MemoPal.Application.Features.MemorySets;
using MemoPal.Application.Features.MemorySets.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.CommunityMemorySets.Commands;

public sealed record CopyCommunityMemorySetCommand(string UserId, string MemorySetId)
    : IRequest<ApiResponse<CommunityMemorySetCopyDto>>;

public sealed class CopyCommunityMemorySetCommandHandler(IAppDbContext db)
    : IRequestHandler<CopyCommunityMemorySetCommand, ApiResponse<CommunityMemorySetCopyDto>>
{
    public async Task<ApiResponse<CommunityMemorySetCopyDto>> Handle(
        CopyCommunityMemorySetCommand request,
        CancellationToken cancellationToken)
    {
        var source = await db.MemorySets.Where(GetCommunityMemorySetsQueryHandler.IsDiscoverable())
            .WithAggregate()
            .FirstOrDefaultAsync(x => x.Id == request.MemorySetId, cancellationToken)
            ?? throw new NotFoundAppException("Public memory set not found.");

        if (source.UserId == request.UserId)
            throw new ValidationAppException("This memory is already in your library.");

        var existing = await db.ForUser(request.UserId).WithAggregate()
            .FirstOrDefaultAsync(x => x.CopiedFromMemorySetId == request.MemorySetId, cancellationToken);
        if (existing is not null)
            return ApiResponse<CommunityMemorySetCopyDto>.Ok(
                new CommunityMemorySetCopyDto(MemorySetAggregate.ToDto(existing), true));

        var duplicateRequest = MemorySetAggregate.CreateDuplicateRequest(source);
        duplicateRequest.Visibility = MemorySetVisibilities.Private;

        var copiedCustomScene = await CopyCustomPalaceSceneAsync(
            db, source, duplicateRequest, request.UserId, cancellationToken);
        if (!copiedCustomScene)
            await MemorySetPalaceValidator.ValidateAsync(db, request.UserId, duplicateRequest, cancellationToken);

        var copy = MemorySetAggregate.Create(request.UserId, duplicateRequest);
        copy.CopiedFromMemorySetId = source.Id;
        await db.MemorySets.AddAsync(copy, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        return ApiResponse<CommunityMemorySetCopyDto>.Ok(
            new CommunityMemorySetCopyDto(MemorySetAggregate.ToDto(copy), false));
    }

    private static async Task<bool> CopyCustomPalaceSceneAsync(
        IAppDbContext db,
        MemorySet source,
        MemorySetUpsertRequest duplicateRequest,
        string targetUserId,
        CancellationToken cancellationToken)
    {
        var sourceSceneId = source.TechniquePlan?.PalaceSceneId;
        if (source.TechniqueKey != MemoryTechniqueKeys.Palace || sourceSceneId is null)
            return false;

        var sourceScene = await db.PalaceScenes.AsNoTracking()
            .Include(x => x.Loci)
            .FirstOrDefaultAsync(x => x.Id == sourceSceneId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("The shared Palace scene is unavailable.");
        if (sourceScene.IsTemplate)
            return false;
        if (!source.SharesPrivateAssets)
            throw new ValidationAppException("The owner has not shared this custom Palace scene.");

        var sceneCopy = new PalaceScene
        {
            UserId = targetUserId,
            Name = sourceScene.Name,
            Description = sourceScene.Description,
            ImageUrl = sourceScene.ImageUrl,
            Status = PalaceSceneStatuses.Published,
            IsTemplate = false,
            IsPremium = false,
            Loci = sourceScene.Loci
                .Where(x => !x.IsDeleted)
                .OrderBy(x => x.Position)
                .Select(x => new PalaceLocus
                {
                    Position = x.Position,
                    Name = x.Name,
                    Description = x.Description,
                    NameEn = x.NameEn,
                    NameZh = x.NameZh,
                    DescriptionEn = x.DescriptionEn,
                    DescriptionZh = x.DescriptionZh,
                    XPercent = x.XPercent,
                    YPercent = x.YPercent,
                    RadiusPercent = x.RadiusPercent
                })
                .ToList()
        };
        var locusIdByPosition = sceneCopy.Loci.ToDictionary(x => x.Position, x => x.Id);
        var sourceLocusPositionById = sourceScene.Loci
            .Where(x => !x.IsDeleted)
            .ToDictionary(x => x.Id, x => x.Position);
        var plan = duplicateRequest.TechniquePlan
            ?? throw new ValidationAppException("The shared Palace plan is incomplete.");
        plan.PalaceSceneId = sceneCopy.Id;
        plan.PalaceBindings = plan.PalaceBindings.Select(binding =>
        {
            if (!sourceLocusPositionById.TryGetValue(binding.LocusId, out var position) ||
                !locusIdByPosition.TryGetValue(position, out var copiedLocusId))
                throw new ValidationAppException("A shared Palace locus is unavailable.");
            return new PalaceBindingInput
            {
                ItemPosition = binding.ItemPosition,
                LocusId = copiedLocusId,
                AssociationText = binding.AssociationText,
                IsCustomScene = binding.IsCustomScene,
                SceneAssetUrl = binding.SceneAssetUrl
            };
        }).ToList();

        await db.PalaceScenes.AddAsync(sceneCopy, cancellationToken);
        return true;
    }
}
