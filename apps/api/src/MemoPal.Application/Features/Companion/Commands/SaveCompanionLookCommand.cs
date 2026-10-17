using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Companion.DTOs;
using MemoPal.Application.Features.Companion.Queries;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Companion.Commands;

public sealed record SaveCompanionLookRequest(
    string AvatarId,
    string? HeadwearId,
    string? BodywearId,
    string? BackwearId,
    string? HandItemId);

public sealed record SaveCompanionLookCommand(string UserId, SaveCompanionLookRequest Request)
    : IRequest<ApiResponse<CompanionDto>>;

public sealed class SaveCompanionLookCommandHandler(IAppDbContext db)
    : IRequestHandler<SaveCompanionLookCommand, ApiResponse<CompanionDto>>
{
    public async Task<ApiResponse<CompanionDto>> Handle(SaveCompanionLookCommand command, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(x => x.Id == command.UserId && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("User not found.");
        var resolvedAvatarId = await GetCompanionQueryHandler.ResolveAvatarId(
            db, user.CompanionAvatarId, user.Level, ct);
        if (string.IsNullOrWhiteSpace(resolvedAvatarId) || command.Request.AvatarId != resolvedAvatarId)
            throw new ValidationAppException("The requested companion is not the selected unlocked companion.");

        var avatar = await db.AvatarDefinitions.FirstAsync(x => x.Id == resolvedAvatarId && x.IsActive && !x.IsDeleted, ct);
        await ValidateItems(db, command.Request, avatar.Key, user.Level, ct);

        var look = await db.CompanionLooks.FirstOrDefaultAsync(
            x => x.UserId == user.Id && x.AvatarId == avatar.Id && !x.IsDeleted, ct);
        if (look is null)
        {
            look = new CompanionLook { Id = Guid.NewGuid().ToString("D"), UserId = user.Id, AvatarId = avatar.Id };
            await db.CompanionLooks.AddAsync(look, ct);
        }
        look.HeadwearId = Normalize(command.Request.HeadwearId);
        look.BodywearId = Normalize(command.Request.BodywearId);
        look.BackwearId = Normalize(command.Request.BackwearId);
        look.HandItemId = Normalize(command.Request.HandItemId);
        await db.SaveChangesAsync(ct);
        return await new GetCompanionQueryHandler(db).Handle(new(user.Id), ct);
    }

    internal static async Task ValidateItems(IAppDbContext db, SaveCompanionLookRequest request, string avatarKey, int userLevel, CancellationToken ct)
    {
        await ValidateItem(db, request.HeadwearId, AppearanceItemTypes.Headwear, avatarKey, userLevel, ct);
        await ValidateItem(db, request.BodywearId, AppearanceItemTypes.Bodywear, avatarKey, userLevel, ct);
        await ValidateItem(db, request.BackwearId, AppearanceItemTypes.Backwear, avatarKey, userLevel, ct);
        await ValidateItem(db, request.HandItemId, AppearanceItemTypes.HandItem, avatarKey, userLevel, ct);
    }

    private static async Task ValidateItem(IAppDbContext db, string? itemId, string slot, string avatarKey, int userLevel, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(itemId)) return;
        var item = await db.AppearanceDefinitions.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == itemId && !x.IsDeleted && x.IsActive, ct)
            ?? throw new ValidationAppException("Appearance item is missing, deleted, or inactive.");
        if (item.ItemType != slot)
            throw new ValidationAppException($"Appearance item does not fit the {slot} slot.");
        if (item.RequiredLevel > userLevel)
            throw new ValidationAppException($"Reach level {item.RequiredLevel} to unlock this appearance item.");
        if (!item.CompanionAvatarKeys.Contains(avatarKey, StringComparer.Ordinal))
            throw new ValidationAppException("Appearance item is not compatible with this companion.");
    }

    private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
