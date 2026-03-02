using MediatR;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Subscriptions.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Subscriptions.Commands;

public sealed record SubscribeCommand(string UserId, SubscribeRequest Request) : IRequest<SubscriptionEntitlementDto>;

public sealed class SubscribeCommandHandler : IRequestHandler<SubscribeCommand, SubscriptionEntitlementDto>
{
    private readonly IAppDbContext _db;

    public SubscribeCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<SubscriptionEntitlementDto> Handle(SubscribeCommand request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var expiresAt = now.AddDays(Math.Max(1, request.Request.DurationDays));

        var subscription = new UserSubscription
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = request.UserId,
            PlanId = request.Request.PlanId,
            Provider = request.Request.Provider,
            ProviderReference = request.Request.ProviderReference,
            Status = "active",
            StartedAt = now,
            ExpiresAt = expiresAt,
            AutoRenew = request.Request.AutoRenew,
            LastVerifiedAt = now,
        };

        _db.UserSubscriptions.Add(subscription);

        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == request.UserId, cancellationToken);
        if (user is not null)
        {
            user.IsPremium = true;
            user.UpdatedAt = now;
        }

        await _db.SaveChangesAsync(cancellationToken);

        return new SubscriptionEntitlementDto(
            true,
            subscription.PlanId,
            subscription.Provider,
            subscription.Status,
            subscription.StartedAt,
            subscription.ExpiresAt,
            subscription.AutoRenew,
            subscription.LastVerifiedAt
        );
    }
}
