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
        var latest = await _db.UserSubscriptions
            .Where(x => x.UserId == request.UserId && !x.IsDeleted)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (latest is null)
        {
            return ApiResponse<SubscriptionEntitlementDto>.Ok(new SubscriptionEntitlementDto(false, null, null, null, null, null, false, null));
        }

        var active = latest.Status == "active" && (!latest.ExpiresAt.HasValue || latest.ExpiresAt > now);
        return ApiResponse<SubscriptionEntitlementDto>.Ok(new SubscriptionEntitlementDto(
            active,
            latest.PlanId,
            latest.Provider,
            latest.Status,
            latest.StartedAt,
            latest.ExpiresAt,
            latest.AutoRenew,
            latest.LastVerifiedAt
        ));
    }
}



