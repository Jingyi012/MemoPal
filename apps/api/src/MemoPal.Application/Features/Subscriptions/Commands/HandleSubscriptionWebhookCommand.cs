using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Subscriptions;
using MemoPal.Application.Features.Subscriptions.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Subscriptions.Commands;

public sealed record HandleSubscriptionWebhookCommand(WebhookSubscriptionEventRequest Request) : IRequest<ApiResponse<SubscriptionEntitlementDto>>;

public sealed class HandleSubscriptionWebhookCommandHandler : IRequestHandler<HandleSubscriptionWebhookCommand, ApiResponse<SubscriptionEntitlementDto>>
{
    private readonly IAppDbContext _db;

    public HandleSubscriptionWebhookCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<SubscriptionEntitlementDto>> Handle(HandleSubscriptionWebhookCommand request, CancellationToken cancellationToken)
    {
        SubscriptionValidation.ValidateAndNormalize(request.Request);

        var now = DateTime.UtcNow;
        var payload = request.Request;

        UserSubscription? subscription = null;
        var isNew = false;
        if (!string.IsNullOrWhiteSpace(payload.ProviderReference))
        {
            subscription = await _db.UserSubscriptions.FirstOrDefaultAsync(
                x => x.Provider == payload.Provider && x.ProviderReference == payload.ProviderReference,
                cancellationToken);
        }

        if (subscription is null)
        {
            isNew = true;
            subscription = new UserSubscription
            {
                Id = Guid.NewGuid().ToString("N"),
                UserId = payload.UserId,
                Provider = payload.Provider,
                ProviderReference = payload.ProviderReference,
                CreatedAt = now,
            };
        }

        subscription.UserId = payload.UserId;
        subscription.PlanId = payload.PlanId;
        subscription.Status = payload.Status;
        subscription.StartedAt = payload.StartedAt;
        subscription.ExpiresAt = payload.ExpiresAt;
        subscription.AutoRenew = payload.AutoRenew;
        subscription.LastVerifiedAt = now;
        subscription.UpdatedAt = now;

        if (isNew)
        {
            _db.UserSubscriptions.Add(subscription);
        }

        var active = payload.Status == "active" && (!payload.ExpiresAt.HasValue || payload.ExpiresAt > now);
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == payload.UserId, cancellationToken);
        if (user is not null)
        {
            user.IsPremium = active;
            user.UpdatedAt = now;
        }

        await _db.SaveChangesAsync(cancellationToken);

        var result = new SubscriptionEntitlementDto(
            active,
            subscription.PlanId,
            subscription.Provider,
            subscription.Status,
            subscription.StartedAt,
            subscription.ExpiresAt,
            subscription.AutoRenew,
            subscription.LastVerifiedAt
        );
        return ApiResponse<SubscriptionEntitlementDto>.Ok(result);
    }
}
