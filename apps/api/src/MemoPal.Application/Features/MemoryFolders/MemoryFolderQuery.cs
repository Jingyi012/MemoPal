using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.MemoryFolders.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.MemoryFolders;

internal static class MemoryFolderQuery
{
    public static IQueryable<MemoryFolder> ForUser(this IAppDbContext db, string userId)
    {
        return db.MemoryFolders.Where(x => x.UserId == userId && !x.IsDeleted);
    }

    public static IQueryable<MemoryFolderDto> ProjectSummary(this IQueryable<MemoryFolder> query)
    {
        return query.Select(folder => new MemoryFolderDto(
            folder.Id,
            folder.Name,
            folder.MemorySets.Count(memorySet => !memorySet.IsDeleted),
            folder.MemorySets
                .Where(memorySet => !memorySet.IsDeleted)
                .SelectMany(memorySet => memorySet.Items)
                .Count(item => !item.IsDeleted),
            folder.CreatedAt,
            folder.UpdatedAt));
    }
}
