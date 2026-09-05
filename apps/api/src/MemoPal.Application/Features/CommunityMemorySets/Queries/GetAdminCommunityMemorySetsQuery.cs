using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.CommunityMemorySets.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.CommunityMemorySets.Queries;

public sealed record GetAdminCommunityMemorySetsQuery(
    string? Search, string? Status, int PageNumber, int PageSize)
    : IRequest<PaginatedResponse<AdminCommunityMemorySetDto>>;

public sealed class GetAdminCommunityMemorySetsQueryHandler(IAppDbContext db)
    : IRequestHandler<GetAdminCommunityMemorySetsQuery, PaginatedResponse<AdminCommunityMemorySetDto>>
{
    public async Task<PaginatedResponse<AdminCommunityMemorySetDto>> Handle(
        GetAdminCommunityMemorySetsQuery request,
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
        var authors = await db.Users.AsNoTracking().Where(x => authorIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, cancellationToken);
        var data = page.Where(x => authors.ContainsKey(x.MemorySet.UserId)).Select(x =>
        {
            var set = x.MemorySet;
            var author = authors[set.UserId];
            return new AdminCommunityMemorySetDto(
                set.Id, set.Title, set.Description, set.GoalType, set.TechniqueKey,
                set.Visibility, set.CommunityStatus, set.PublishedAt, set.HiddenAt, set.HiddenReason,
                new CommunityAuthorDto(author.Id, author.DisplayName, author.AvatarUrl),
                x.ItemCount, x.CopyCount, x.ReportCount, set.CreatedAt, set.UpdatedAt);
        }).ToList();

        return PaginatedResponse<AdminCommunityMemorySetDto>.Ok(data, pageNumber, pageSize, totalCount);
    }
}
