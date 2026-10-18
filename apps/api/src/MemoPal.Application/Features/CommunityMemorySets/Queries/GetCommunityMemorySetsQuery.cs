using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.CommunityMemorySets.DTOs;
using MemoPal.Application.Features.MemorySets;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.CommunityMemorySets.Queries;

public sealed record GetCommunityMemorySetsQuery(
    string UserId,
    string? Search,
    string? TechniqueKey,
    string? GoalType,
    string? Sort,
    int PageNumber,
    int PageSize,
    bool BookmarkedOnly = false) : IRequest<PaginatedResponse<CommunityMemorySetSummaryDto>>;

public sealed class GetCommunityMemorySetsQueryHandler(IAppDbContext db)
    : IRequestHandler<GetCommunityMemorySetsQuery, PaginatedResponse<CommunityMemorySetSummaryDto>>
{
    public async Task<PaginatedResponse<CommunityMemorySetSummaryDto>> Handle(
        GetCommunityMemorySetsQuery request,
        CancellationToken cancellationToken)
    {
        var pageNumber = Math.Max(1, request.PageNumber);
        var pageSize = Math.Clamp(request.PageSize, 1, 50);
        var query = db.MemorySets.AsNoTracking().Where(IsDiscoverable());
        if (request.BookmarkedOnly)
            query = query.Where(x => db.CommunityMemorySetBookmarks.Any(bookmark =>
                bookmark.MemorySetId == x.Id && bookmark.UserId == request.UserId && !bookmark.IsDeleted));

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(x => x.Title.ToLower().Contains(search) ||
                                     (x.Description != null && x.Description.ToLower().Contains(search)));
        }

        if (MemoryTechniqueKeys.All.Contains(request.TechniqueKey ?? string.Empty))
            query = query.Where(x => x.TechniqueKey == request.TechniqueKey);
        if (MemoryGoalTypes.All.Contains(request.GoalType ?? string.Empty))
            query = query.Where(x => x.GoalType == request.GoalType);

        var totalCount = await query.CountAsync(cancellationToken);
        query = string.Equals(request.Sort, "featured", StringComparison.OrdinalIgnoreCase)
            ? query.OrderByDescending(x => x.FeaturedAt != null).ThenByDescending(x => x.FeaturedAt)
                .ThenByDescending(x => x.PublishedAt).ThenBy(x => x.Id)
            : string.Equals(request.Sort, "popular", StringComparison.OrdinalIgnoreCase)
            ? query.OrderByDescending(x => x.Copies.Count(copy => !copy.IsDeleted))
                .ThenByDescending(x => x.PublishedAt)
                .ThenBy(x => x.Id)
            : query.OrderByDescending(x => x.PublishedAt).ThenBy(x => x.Id);

        var memorySets = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .WithAggregate()
            .ToListAsync(cancellationToken);

        var data = await MapSummariesAsync(memorySets, request.UserId, cancellationToken);
        return PaginatedResponse<CommunityMemorySetSummaryDto>.Ok(data, pageNumber, pageSize, totalCount);
    }

    private async Task<IReadOnlyList<CommunityMemorySetSummaryDto>> MapSummariesAsync(
        IReadOnlyList<MemorySet> memorySets,
        string userId,
        CancellationToken cancellationToken)
    {
        var ids = memorySets.Select(x => x.Id).ToList();
        var authorIds = memorySets.Select(x => x.UserId).Distinct().ToList();
        var sceneIds = memorySets.Select(x => x.TechniquePlan?.PalaceSceneId)
            .Where(x => x is not null).Cast<string>().Distinct().ToList();
        var authors = await db.Users.AsNoTracking().Where(x => authorIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, cancellationToken);
        var copies = await db.MemorySets.AsNoTracking()
            .Where(x => x.CopiedFromMemorySetId != null && ids.Contains(x.CopiedFromMemorySetId) && !x.IsDeleted)
            .GroupBy(x => x.CopiedFromMemorySetId!)
            .Select(x => new { Id = x.Key, Count = x.Count() })
            .ToDictionaryAsync(x => x.Id, x => x.Count, cancellationToken);
        var existingCopies = await db.MemorySets.AsNoTracking()
            .Where(x => x.UserId == userId && x.CopiedFromMemorySetId != null &&
                        ids.Contains(x.CopiedFromMemorySetId) && !x.IsDeleted)
            .ToDictionaryAsync(x => x.CopiedFromMemorySetId!, x => x.Id, cancellationToken);
        var helpfulReactions = await db.CommunityMemorySetReactions.AsNoTracking()
            .Where(x => !x.IsDeleted && ids.Contains(x.MemorySetId))
            .GroupBy(x => x.MemorySetId)
            .Select(group => new
            {
                MemorySetId = group.Key,
                Count = group.Count(),
                IsHelpful = group.Any(x => x.UserId == userId),
            })
            .ToDictionaryAsync(x => x.MemorySetId, cancellationToken);
        var bookmarks = await db.CommunityMemorySetBookmarks.AsNoTracking()
            .Where(x => !x.IsDeleted && x.UserId == userId && ids.Contains(x.MemorySetId))
            .Select(x => x.MemorySetId)
            .ToHashSetAsync(cancellationToken);
        var covers = await db.PalaceScenes.AsNoTracking().Where(x => sceneIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x.ImageUrl, cancellationToken);

        return memorySets.Where(x => authors.ContainsKey(x.UserId)).Select(x =>
            CommunityMemorySetMapper.ToSummary(
                x,
                authors[x.UserId],
                copies.GetValueOrDefault(x.Id),
                helpfulReactions.GetValueOrDefault(x.Id)?.Count ?? 0,
                helpfulReactions.GetValueOrDefault(x.Id)?.IsHelpful ?? false,
                bookmarks.Contains(x.Id),
                x.UserId == userId ? x.Id : existingCopies.GetValueOrDefault(x.Id),
                x.TechniquePlan?.PalaceSceneId is { } sceneId ? covers.GetValueOrDefault(sceneId) : null))
            .ToList();
    }

    internal static System.Linq.Expressions.Expression<Func<MemorySet, bool>> IsDiscoverable() => x =>
        !x.IsDeleted &&
        x.Visibility == MemorySetVisibilities.Public &&
        x.CommunityStatus == MemorySetCommunityStatuses.Visible &&
        (x.Status == MemorySetStatuses.Ready || x.Status == MemorySetStatuses.Active);
}
