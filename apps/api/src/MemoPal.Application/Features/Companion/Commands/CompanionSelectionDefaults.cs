using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Companion.Commands;

internal static class CompanionSelectionDefaults
{
    public static async Task EnsureInitializedAsync(
        IAppDbContext db,
        User user,
        CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(user.CompanionAvatarId)) return;

        user.CompanionAvatarId = await db.AvatarDefinitions.AsNoTracking()
            .Where(x => x.IsActive && !x.IsDeleted && x.RequiredLevel <= user.Level)
            .OrderBy(x => x.SortOrder).ThenBy(x => x.RequiredLevel).ThenBy(x => x.Key)
            .Select(x => x.Id)
            .FirstOrDefaultAsync(cancellationToken);
    }
}
