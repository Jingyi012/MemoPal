using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.PredefinedMemoryLessons;

internal static class ContentLibraryPersistence
{
    public static async Task SaveChangesAsync(IAppDbContext db, CancellationToken ct)
    {
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConflictAppException("This content changed while you were editing. Reload the library before trying again.");
        }
    }
}
