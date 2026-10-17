using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Appearance.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Appearance.Commands;

public sealed record CreateAppearanceDefinitionCommand(AppearanceDefinitionUpsertRequest Request)
    : IRequest<ApiResponse<AppearanceDefinitionDto>>;

public sealed class CreateAppearanceDefinitionCommandHandler(IAppDbContext db)
    : IRequestHandler<CreateAppearanceDefinitionCommand, ApiResponse<AppearanceDefinitionDto>>
{
    public async Task<ApiResponse<AppearanceDefinitionDto>> Handle(
        CreateAppearanceDefinitionCommand command,
        CancellationToken cancellationToken)
    {
        var request = command.Request;
        if (string.IsNullOrWhiteSpace(request.Key) ||
            string.IsNullOrWhiteSpace(request.ItemType) ||
            string.IsNullOrWhiteSpace(request.ImageUrl) ||
            string.IsNullOrWhiteSpace(request.TitleEn) ||
            string.IsNullOrWhiteSpace(request.TitleZh))
        {
            throw new ValidationAppException("key, itemType, artwork, titleEn, and titleZh are required.");
        }

        var itemType = request.ItemType.Trim().ToLowerInvariant();
        if (itemType == "handitem") itemType = AppearanceItemTypes.HandItem;
        if (!AppearanceItemTypes.All.Contains(itemType))
            throw new ValidationAppException("itemType must be frame, decoration, outfit, headwear, bodywear, backwear, or handItem.");
        if (request.RequiredLevel < 1)
            throw new ValidationAppException("requiredLevel must be at least 1.");
        var companionAvatarKey = string.IsNullOrWhiteSpace(request.CompanionAvatarKey) ? null : request.CompanionAvatarKey.Trim().ToLowerInvariant();
        var setKey = string.IsNullOrWhiteSpace(request.SetKey) ? null : request.SetKey.Trim().ToLowerInvariant();
        if (itemType is AppearanceItemTypes.Headwear or AppearanceItemTypes.Bodywear or AppearanceItemTypes.Backwear or AppearanceItemTypes.HandItem)
        {
            if (companionAvatarKey is null || !await db.AvatarDefinitions.AnyAsync(x => x.Key == companionAvatarKey && x.IsActive && !x.IsDeleted, cancellationToken))
                throw new ValidationAppException("Wearable items require an active companionAvatarKey.");
        }
        if (setKey?.Length > 64 || companionAvatarKey?.Length > 64)
            throw new ValidationAppException("companionAvatarKey and setKey must be at most 64 characters.");
        if (setKey is not null && (string.IsNullOrWhiteSpace(request.SetTitleEn) || string.IsNullOrWhiteSpace(request.SetTitleZh) ||
                                   string.IsNullOrWhiteSpace(request.SetStoryEn) || string.IsNullOrWhiteSpace(request.SetStoryZh)))
            throw new ValidationAppException("Outfit sets require a title and story in English and Chinese.");

        var key = request.Key.Trim().ToLowerInvariant();
        var entity = string.IsNullOrWhiteSpace(request.Id)
            ? null
            : await db.AppearanceDefinitions.FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
        var duplicate = await db.AppearanceDefinitions.AnyAsync(
            x => x.Key == key && x.Id != request.Id && !x.IsDeleted,
            cancellationToken);
        if (duplicate)
            throw new ConflictAppException("An appearance item with this key already exists.");

        var now = DateTime.UtcNow;
        if (entity is null)
        {
            entity = new AppearanceDefinition
            {
                Id = string.IsNullOrWhiteSpace(request.Id) ? Guid.NewGuid().ToString("N") : request.Id!,
                CreatedAt = now,
                CreatedBy = "admin",
            };
            await db.AppearanceDefinitions.AddAsync(entity, cancellationToken);
        }

        entity.Key = key;
        entity.ItemType = itemType;
        entity.CompanionAvatarKey = companionAvatarKey;
        entity.SetKey = setKey;
        entity.SetTitleEn = string.IsNullOrWhiteSpace(request.SetTitleEn) ? null : request.SetTitleEn.Trim();
        entity.SetTitleZh = string.IsNullOrWhiteSpace(request.SetTitleZh) ? null : request.SetTitleZh.Trim();
        entity.SetStoryEn = string.IsNullOrWhiteSpace(request.SetStoryEn) ? null : request.SetStoryEn.Trim();
        entity.SetStoryZh = string.IsNullOrWhiteSpace(request.SetStoryZh) ? null : request.SetStoryZh.Trim();
        entity.AssetKey = string.IsNullOrWhiteSpace(request.AssetKey) ? key : request.AssetKey.Trim();
        entity.ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim();
        entity.TitleEn = request.TitleEn.Trim();
        entity.TitleZh = request.TitleZh.Trim();
        entity.DescriptionEn = request.DescriptionEn?.Trim() ?? string.Empty;
        entity.DescriptionZh = request.DescriptionZh?.Trim() ?? string.Empty;
        entity.RequiredLevel = request.RequiredLevel;
        entity.SortOrder = request.SortOrder;
        entity.IsActive = request.IsActive;
        entity.IsDeleted = false;
        entity.DeletedAt = null;
        entity.UpdatedAt = now;
        entity.UpdatedBy = "admin";

        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<AppearanceDefinitionDto>.Ok(entity.Adapt<AppearanceDefinitionDto>());
    }
}

public sealed record UpdateAppearanceDefinitionCommand(string AppearanceId, AppearanceDefinitionUpsertRequest Request)
    : IRequest<ApiResponse<AppearanceDefinitionDto>>;

public sealed class UpdateAppearanceDefinitionCommandHandler(ISender sender)
    : IRequestHandler<UpdateAppearanceDefinitionCommand, ApiResponse<AppearanceDefinitionDto>>
{
    public Task<ApiResponse<AppearanceDefinitionDto>> Handle(
        UpdateAppearanceDefinitionCommand request,
        CancellationToken cancellationToken)
    {
        request.Request.Id = request.AppearanceId;
        return sender.Send(new CreateAppearanceDefinitionCommand(request.Request), cancellationToken);
    }
}

public sealed record DeleteAppearanceDefinitionCommand(string AppearanceId) : IRequest<ApiResponse<bool>>;

public sealed class DeleteAppearanceDefinitionCommandHandler(IAppDbContext db)
    : IRequestHandler<DeleteAppearanceDefinitionCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(DeleteAppearanceDefinitionCommand request, CancellationToken cancellationToken)
    {
        var entity = await db.AppearanceDefinitions.FirstOrDefaultAsync(
            x => x.Id == request.AppearanceId && !x.IsDeleted,
            cancellationToken);
        if (entity is null) return ApiResponse<bool>.Ok(false);

        entity.IsDeleted = true;
        entity.IsActive = false;
        entity.DeletedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;
        entity.UpdatedBy = "admin";
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true);
    }
}
