using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Subscriptions.Admin.Contracts;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Subscriptions.Queries;

public sealed record GetPagedUserSubscriptionsQuery(SubscriptionFilter Filter)
    : IRequest<PaginatedResponse<UserSubscriptionView>>;

public sealed class GetPagedUserSubscriptionsQueryHandler
    : IRequestHandler<GetPagedUserSubscriptionsQuery, PaginatedResponse<UserSubscriptionView>>
{
    private readonly IAppDbContext _db;

    public GetPagedUserSubscriptionsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<PaginatedResponse<UserSubscriptionView>> Handle(GetPagedUserSubscriptionsQuery request, CancellationToken cancellationToken)
    {
        var pageNumber = Math.Max(1, request.Filter.PageNumber);
        var pageSize = Math.Clamp(request.Filter.PageSize, 1, 100);

        var query =
            from subscription in _db.UserSubscriptions.AsNoTracking()
            join user in _db.Users.AsNoTracking() on subscription.UserId equals user.Id
            where !subscription.IsDeleted
            select new { Subscription = subscription, User = user };

        if (!string.IsNullOrWhiteSpace(request.Filter.Status))
        {
            var status = request.Filter.Status.Trim().ToLowerInvariant();
            query = query.Where(x => x.Subscription.Status.ToLower() == status);
        }

        if (!string.IsNullOrWhiteSpace(request.Filter.Search))
        {
            var search = request.Filter.Search.Trim().ToLowerInvariant();
            query = query.Where(x =>
                x.Subscription.UserId.ToLower().Contains(search) ||
                x.User.Email.ToLower().Contains(search) ||
                x.User.DisplayName.ToLower().Contains(search) ||
                x.Subscription.PlanId.ToLower().Contains(search) ||
                x.Subscription.Provider.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(x => x.Subscription.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new UserSubscriptionView(
                x.Subscription.Id,
                x.Subscription.UserId,
                x.Subscription.PlanId,
                x.Subscription.Provider,
                x.Subscription.ProviderReference,
                x.Subscription.Status,
                x.Subscription.StartedAt,
                x.Subscription.ExpiresAt,
                x.Subscription.AutoRenew,
                x.Subscription.LastVerifiedAt,
                x.Subscription.CreatedAt,
                x.Subscription.UpdatedAt,
                x.User.Email,
                x.User.DisplayName
            ))
            .ToListAsync(cancellationToken);

        return PaginatedResponse<UserSubscriptionView>.Ok(items, pageNumber, pageSize, totalCount);
    }
}
