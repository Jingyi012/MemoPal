using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Subscriptions.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Subscriptions.Commands;

public sealed record CancelSubscriptionCommand(string UserId) : IRequest<ApiResponse<SubscriptionEntitlementDto>>;

public sealed class CancelSubscriptionCommandHandler : IRequestHandler<CancelSubscriptionCommand, ApiResponse<SubscriptionEntitlementDto>>
{
    private readonly IAppDbContext _db;

    public CancelSubscriptionCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<SubscriptionEntitlementDto>> Handle(
        CancelSubscriptionCommand request,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var subscription = await _db.UserSubscriptions
            .Where(x => x.UserId == request.UserId && !x.IsDeleted && x.Status == "active")
            .Where(x => !x.ExpiresAt.HasValue || x.ExpiresAt > now)
            .OrderByDescending(x => x.ExpiresAt ?? DateTime.MaxValue)
            .ThenByDescending(x => x.StartedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (subscription is null)
        {
            throw new NotFoundAppException("No active subscription was found.");
        }

        subscription.AutoRenew = false;
        subscription.Status = "canceled";
        subscription.LastVerifiedAt = now;
        await _db.SaveChangesAsync(cancellationToken);

        return ApiResponse<SubscriptionEntitlementDto>.Ok(new SubscriptionEntitlementDto(
            true,
            subscription.PlanId,
            subscription.Provider,
            subscription.Status,
            subscription.StartedAt,
            subscription.ExpiresAt,
            subscription.AutoRenew,
            subscription.LastVerifiedAt));
    }
}
