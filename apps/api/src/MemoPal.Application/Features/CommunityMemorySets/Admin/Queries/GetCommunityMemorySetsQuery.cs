using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.CommunityMemorySets.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.CommunityMemorySets.Admin.Queries;

public sealed record GetCommunityMemorySetsQuery(
    string? Search, string? Status, int PageNumber, int PageSize)
    : IRequest<PaginatedResponse<CommunityMemorySetView>>;

public sealed class GetCommunityMemorySetsQueryHandler(IAppDbContext db)
    : IRequestHandler<GetCommunityMemorySetsQuery, PaginatedResponse<CommunityMemorySetView>>
{
    public async Task<PaginatedResponse<CommunityMemorySetView>> Handle(
        GetCommunityMemorySetsQuery request,
        CancellationToken cancellationToken)
    {
        var pageNumber = Math.Max(1, request.PageNumber);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);
        var query = db.MemorySets.AsNoTracking().Where(x =>
            !x.IsDeleted &&
            x.Visibility == MemorySetVisibilities.Public &&
            x.PublishedAt != null);
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(x => x.Title.ToLower().Contains(search) ||
                (x.Description != null && x.Description.ToLower().Contains(search)));
        }
        if (MemorySetCommunityStatuses.All.Contains(request.Status ?? string.Empty))
            query = query.Where(x => x.CommunityStatus == request.Status);

        var totalCount = await query.CountAsync(cancellationToken);
        var page = await query.OrderByDescending(x => x.PublishedAt).ThenBy(x => x.Id)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize)
            .Select(x => new
            {
                MemorySet = x,
                ItemCount = x.Items.Count(item => !item.IsDeleted),
                CopyCount = x.Copies.Count(copy => !copy.IsDeleted),
                ReportCount = x.Reports.Count(report => !report.IsDeleted)
            })
            .ToListAsync(cancellationToken);
        var authorIds = page.Select(x => x.MemorySet.UserId).Distinct().ToList();
        var memorySetIds = page.Select(x => x.MemorySet.Id).ToList();
        var authors = await db.Users.AsNoTracking().Where(x => authorIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, cancellationToken);
        var reports = await db.MemorySetReports.AsNoTracking()
            .Where(x => memorySetIds.Contains(x.MemorySetId) && !x.IsDeleted)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new { x.Id, x.MemorySetId, x.Reason, x.Details, x.CreatedAt })
            .ToListAsync(cancellationToken);
        var reportsByMemorySet = reports
            .GroupBy(x => x.MemorySetId)
            .ToDictionary(
                group => group.Key,
                group => (IReadOnlyList<MemorySetReportView>)group
                    .Select(x => new MemorySetReportView(x.Id, x.Reason, x.Details, x.CreatedAt))
                    .ToList());
        var data = page.Where(x => authors.ContainsKey(x.MemorySet.UserId)).Select(x =>
        {
            var set = x.MemorySet;
            var author = authors[set.UserId];
            return new CommunityMemorySetView(
                set.Id, set.Title, set.Description, set.GoalType, set.TechniqueKey,
                set.Visibility, set.CommunityStatus, set.PublishedAt, set.FeaturedAt, set.HiddenAt, set.HiddenReason,
                new CommunityAuthorDto(author.Id, author.DisplayName, author.AvatarUrl),
                x.ItemCount, x.CopyCount, x.ReportCount,
                reportsByMemorySet.GetValueOrDefault(set.Id, []),
                set.CreatedAt, set.UpdatedAt);
        }).ToList();

        return PaginatedResponse<CommunityMemorySetView>.Ok(data, pageNumber, pageSize, totalCount);
    }
}
