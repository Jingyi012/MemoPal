using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Subscriptions.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Subscriptions.Queries;

public sealed record GetEntitlementQuery(string UserId) : IRequest<ApiResponse<SubscriptionEntitlementDto>>;

public sealed class GetEntitlementQueryHandler : IRequestHandler<GetEntitlementQuery, ApiResponse<SubscriptionEntitlementDto>>
{
    private readonly IAppDbContext _db;

    public GetEntitlementQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<SubscriptionEntitlementDto>> Handle(GetEntitlementQuery request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var subscriptions = await _db.UserSubscriptions
            .Where(x => x.UserId == request.UserId && !x.IsDeleted)
            .OrderByDescending(x => x.StartedAt)
            .ThenByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        if (subscriptions.Count == 0)
        {
            return ApiResponse<SubscriptionEntitlementDto>.Ok(new SubscriptionEntitlementDto(false, null, null, null, null, null, false, null));
        }

        var active = subscriptions
            .Where(x => (x.Status == "active" || x.Status == "canceled") && (!x.ExpiresAt.HasValue || x.ExpiresAt > now))
            .OrderByDescending(x => x.ExpiresAt ?? DateTime.MaxValue)
            .ThenByDescending(x => x.StartedAt)
            .FirstOrDefault();

        var selected = active ?? subscriptions[0];
        var isPremiumActive = active is not null;

        return ApiResponse<SubscriptionEntitlementDto>.Ok(new SubscriptionEntitlementDto(
            isPremiumActive,
            selected.PlanId,
            selected.Provider,
            selected.Status,
            selected.StartedAt,
            selected.ExpiresAt,
            selected.AutoRenew,
            selected.LastVerifiedAt
        ));
    }
}



