using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Common.Security;

public static class PalaceAccessPolicy
{
    public static async Task<Palace?> FindAccessiblePalaceAsync(
        IAppDbContext db,
        string palaceId,
        string userId,
        bool isAdmin,
        CancellationToken cancellationToken)
    {
        var palace = await db.Palaces.FirstOrDefaultAsync(
            x => x.Id == palaceId && !x.IsDeleted,
            cancellationToken);
        if (palace is null)
        {
            return null;
        }

        if (isAdmin || !palace.IsCustom)
        {
            return palace;
        }

        var isOwner = await IsCustomPalaceOwnerAsync(db, palaceId, userId, cancellationToken);
        if (isOwner)
        {
            return palace;
        }

        var isAdminConfigured = await IsAdminConfiguredCustomPalaceAsync(db, palace, cancellationToken);
        return isAdminConfigured ? palace : null;
    }

    public static async Task<bool> IsCustomPalaceOwnerAsync(
        IAppDbContext db,
        string palaceId,
        string userId,
        CancellationToken cancellationToken)
    {
        var hasRelationOwnership = await db.UserPalaces.AnyAsync(
            x => x.PalaceId == palaceId &&
                 x.UserId == userId &&
                 x.IsOwner &&
                 !x.IsDeleted,
            cancellationToken);
        if (hasRelationOwnership)
        {
            return true;
        }

        return await db.Palaces.AnyAsync(
            x => x.Id == palaceId &&
                 x.IsCustom &&
                 x.CreatedBy == userId &&
                 !x.IsDeleted,
            cancellationToken);
    }

    public static async Task<bool> CanManagePalaceAsync(
        IAppDbContext db,
        string palaceId,
        string userId,
        bool isAdmin,
        CancellationToken cancellationToken)
    {
        if (isAdmin)
        {
            return true;
        }

        var palace = await db.Palaces
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == palaceId && !x.IsDeleted, cancellationToken);
        if (palace is null || !palace.IsCustom)
        {
            return false;
        }

        return await IsCustomPalaceOwnerAsync(db, palaceId, userId, cancellationToken);
    }

    public static async Task<Palace?> FindManageablePalaceAsync(
        IAppDbContext db,
        string palaceId,
        string userId,
        bool isAdmin,
        CancellationToken cancellationToken)
    {
        var palace = await db.Palaces.FirstOrDefaultAsync(
            x => x.Id == palaceId && !x.IsDeleted,
            cancellationToken);
        if (palace is null)
        {
            return null;
        }

        if (isAdmin)
        {
            return palace;
        }

        if (!palace.IsCustom)
        {
            return null;
        }

        var isOwner = await IsCustomPalaceOwnerAsync(db, palaceId, userId, cancellationToken);
        return isOwner ? palace : null;
    }

    public static Task<bool> IsAdminConfiguredCustomPalaceAsync(
        IAppDbContext db,
        Palace palace,
        CancellationToken cancellationToken)
    {
        if (!palace.IsCustom || string.IsNullOrWhiteSpace(palace.CreatedBy))
        {
            return Task.FromResult(false);
        }

        return db.Users.AsNoTracking().AnyAsync(
            x => x.Id == palace.CreatedBy &&
                 x.Role == UserRoles.Admin &&
                 !x.IsDeleted,
            cancellationToken);
    }
}
