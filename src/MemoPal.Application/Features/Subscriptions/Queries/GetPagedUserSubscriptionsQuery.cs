using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Subscriptions.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Subscriptions.Queries;

public sealed record GetPagedUserSubscriptionsQuery(AdminSubscriptionFilter Filter)
    : IRequest<PaginatedResponse<AdminUserSubscriptionDto>>;

public sealed class GetPagedUserSubscriptionsQueryHandler
    : IRequestHandler<GetPagedUserSubscriptionsQuery, PaginatedResponse<AdminUserSubscriptionDto>>
{
    private readonly IAppDbContext _db;

    public GetPagedUserSubscriptionsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<PaginatedResponse<AdminUserSubscriptionDto>> Handle(GetPagedUserSubscriptionsQuery request, CancellationToken cancellationToken)
    {
        var pageNumber = Math.Max(1, request.Filter.PageNumber);
        var pageSize = Math.Clamp(request.Filter.PageSize, 1, 100);

        var query = _db.UserSubscriptions.AsNoTracking().Where(x => !x.IsDeleted);

        if (!string.IsNullOrWhiteSpace(request.Filter.Status))
        {
            var status = request.Filter.Status.Trim().ToLowerInvariant();
            query = query.Where(x => x.Status.ToLower() == status);
        }

        if (!string.IsNullOrWhiteSpace(request.Filter.Search))
        {
            var search = request.Filter.Search.Trim().ToLowerInvariant();
            query = query.Where(x =>
                x.UserId.ToLower().Contains(search) ||
                x.PlanId.ToLower().Contains(search) ||
                x.Provider.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new AdminUserSubscriptionDto(
                x.Id,
                x.UserId,
                x.PlanId,
                x.Provider,
                x.ProviderReference,
                x.Status,
                x.StartedAt,
                x.ExpiresAt,
                x.AutoRenew,
                x.LastVerifiedAt,
                x.CreatedAt,
                x.UpdatedAt
            ))
            .ToListAsync(cancellationToken);

        return PaginatedResponse<AdminUserSubscriptionDto>.Ok(items, pageNumber, pageSize, totalCount);
    }
}
