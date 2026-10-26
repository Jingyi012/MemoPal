using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Common;

public static class AccountRestrictions
{
    public const string ForbiddenMessage = "Access denied.";

    // Unknown/missing modes fail closed. Never trust client fields or stale JWT claims.
    public static async Task<bool> IsRestrictedAsync(IAppDbContext db, string userId, CancellationToken ct) =>
        await db.Users.AsNoTracking().Where(user => user.Id == userId && !user.IsDeleted)
            .Select(user => (AccountMode?)user.AccountMode).FirstOrDefaultAsync(ct) != AccountMode.Standard;

    public static async Task RequirePrivateAsync(IAppDbContext db, string userId, string visibility, CancellationToken ct)
    {
        if (visibility != MemorySetVisibilities.Private && await IsRestrictedAsync(db, userId, ct))
            throw new AppException(ForbiddenMessage, 403);
    }
}
