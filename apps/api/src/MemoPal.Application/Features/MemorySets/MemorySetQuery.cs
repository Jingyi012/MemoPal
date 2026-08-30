using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.MemorySets;

internal static class MemorySetQuery
{
    public static IQueryable<MemorySet> WithAggregate(this IQueryable<MemorySet> query)
    {
        return query
            .Include(x => x.Items.Where(item => !item.IsDeleted))
            .Include(x => x.TechniquePlan)
                .ThenInclude(x => x!.PegBindings.Where(binding => !binding.IsDeleted))
            .Include(x => x.TechniquePlan)
                .ThenInclude(x => x!.PalaceBindings.Where(binding => !binding.IsDeleted));
    }

    public static IQueryable<MemorySet> ForUser(
        this IAppDbContext db,
        string userId,
        bool includeDeleted = false)
    {
        return db.MemorySets.Where(x =>
            x.UserId == userId &&
            (includeDeleted || !x.IsDeleted));
    }
}
