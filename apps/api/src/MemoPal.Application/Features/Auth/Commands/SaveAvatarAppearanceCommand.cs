using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Auth.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Auth.Commands;

public sealed record SaveAvatarAppearanceCommand(
    string UserId,
    string Source,
    string? AvatarId,
    string? AvatarUrl,
    string? FrameId,
    string? DecorationId,
    string? OutfitId) : IRequest<ApiResponse<UserWithStatDto>>;

public sealed class SaveAvatarAppearanceCommandHandler(IAppDbContext db)
    : IRequestHandler<SaveAvatarAppearanceCommand, ApiResponse<UserWithStatDto>>
{
    public async Task<ApiResponse<UserWithStatDto>> Handle(
        SaveAvatarAppearanceCommand request,
        CancellationToken cancellationToken)
    {
        var user = await db.Users.FirstOrDefaultAsync(x => x.Id == request.UserId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("User not found.");

        var source = request.Source.Trim().ToLowerInvariant();
        if (source is not (AvatarSources.Companion or AvatarSources.Photo))
            throw new ValidationAppException("source must be companion or photo.");

        if (source == AvatarSources.Photo && string.IsNullOrWhiteSpace(request.AvatarUrl) && string.IsNullOrWhiteSpace(user.AvatarUrl))
            throw new ValidationAppException("A photo is required when using photo mode.");

        if (source == AvatarSources.Companion && !string.IsNullOrWhiteSpace(request.AvatarId))
            await ValidateAvatarAsync(request.AvatarId, user.Level, cancellationToken);

        var frame = await ValidateItemAsync(request.FrameId, AppearanceItemTypes.Frame, user.Level, cancellationToken);
        var decoration = await ValidateItemAsync(request.DecorationId, AppearanceItemTypes.Decoration, user.Level, cancellationToken);
        var outfit = await ValidateItemAsync(request.OutfitId, AppearanceItemTypes.Outfit, user.Level, cancellationToken);

        user.AvatarSource = source;
        user.SelectedAvatarId = Normalize(request.AvatarId);
        user.SelectedAvatarFrameId = frame?.Id;
        user.SelectedAvatarDecorationId = decoration?.Id;
        user.SelectedAvatarOutfitId = outfit?.Id;
        if (!string.IsNullOrWhiteSpace(request.AvatarUrl))
            user.AvatarUrl = request.AvatarUrl.Trim();

        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        var stats = await db.UserStats.FirstOrDefaultAsync(x => x.UserId == user.Id, cancellationToken);
        return ApiResponse<UserWithStatDto>.Ok((user, stats).Adapt<UserWithStatDto>());
    }

    private async Task ValidateAvatarAsync(string avatarId, int level, CancellationToken cancellationToken)
    {
        var avatar = await db.AvatarDefinitions.FirstOrDefaultAsync(
            x => x.Id == avatarId && !x.IsDeleted && x.IsActive,
            cancellationToken);
        if (avatar is null)
            throw new NotFoundAppException("Avatar not found.");
        if (avatar.RequiredLevel > level)
            throw new ValidationAppException($"Reach level {avatar.RequiredLevel} to unlock this avatar.");
    }

    private async Task<AppearanceDefinition?> ValidateItemAsync(
        string? itemId,
        string itemType,
        int level,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(itemId)) return null;
        var item = await db.AppearanceDefinitions.FirstOrDefaultAsync(
            x => x.Id == itemId && x.ItemType == itemType && !x.IsDeleted && x.IsActive,
            cancellationToken);
        if (item is null)
            throw new NotFoundAppException("Appearance item not found.");
        if (item.RequiredLevel > level)
            throw new ValidationAppException($"Reach level {item.RequiredLevel} to unlock this appearance item.");
        return item;
    }

    private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
