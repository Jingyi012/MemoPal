using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Users.Queries;

internal static class ManagedUserDataQueryHelpers
{
    public static int NormalizePageNumber(int pageNumber) => pageNumber <= 0 ? 1 : pageNumber;

    public static int NormalizePageSize(int pageSize, int defaultSize = 20, int maxSize = 200)
    {
        if (pageSize <= 0)
        {
            return defaultSize;
        }

        return Math.Min(pageSize, maxSize);
    }

    public static async Task EnsureUserExistsAsync(IAppDbContext db, string userId, CancellationToken cancellationToken)
    {
        var exists = await db.Users.AsNoTracking().AnyAsync(x => x.Id == userId, cancellationToken);
        if (!exists)
        {
            throw new NotFoundAppException("User not found.");
        }
    }
}
