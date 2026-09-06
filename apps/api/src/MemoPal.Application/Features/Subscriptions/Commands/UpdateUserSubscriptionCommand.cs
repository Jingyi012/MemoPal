using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Subscriptions.Admin.Contracts;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Subscriptions.Commands;

public sealed record UpdateUserSubscriptionCommand(string SubscriptionId, UpdateSubscriptionRequest Request)
    : IRequest<ApiResponse<UserSubscriptionView>>;

public sealed class UpdateUserSubscriptionCommandHandler
    : IRequestHandler<UpdateUserSubscriptionCommand, ApiResponse<UserSubscriptionView>>
{
    private readonly IAppDbContext _db;

    public UpdateUserSubscriptionCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<UserSubscriptionView>> Handle(UpdateUserSubscriptionCommand request, CancellationToken cancellationToken)
    {
        var entity = await _db.UserSubscriptions.FirstOrDefaultAsync(x => x.Id == request.SubscriptionId && !x.IsDeleted, cancellationToken);
        if (entity is null)
            return ApiResponse<UserSubscriptionView>.Fail("Subscription not found.");

        if (!string.IsNullOrWhiteSpace(request.Request.Status))
            entity.Status = request.Request.Status.Trim().ToLowerInvariant();

        if (request.Request.ExpiresAt.HasValue)
            entity.ExpiresAt = request.Request.ExpiresAt;

        if (request.Request.AutoRenew.HasValue)
            entity.AutoRenew = request.Request.AutoRenew.Value;

        if (request.Request.LastVerifiedAt.HasValue)
            entity.LastVerifiedAt = request.Request.LastVerifiedAt;

        entity.UpdatedAt = DateTime.UtcNow;

        var active = entity.Status == "active" && (!entity.ExpiresAt.HasValue || entity.ExpiresAt > DateTime.UtcNow);
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == entity.UserId, cancellationToken);
        if (user is not null)
        {
            user.IsPremium = active;
            user.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(cancellationToken);

        var dto = new UserSubscriptionView(
            entity.Id,
            entity.UserId,
            entity.PlanId,
            entity.Provider,
            entity.ProviderReference,
            entity.Status,
            entity.StartedAt,
            entity.ExpiresAt,
            entity.AutoRenew,
            entity.LastVerifiedAt,
            entity.CreatedAt,
            entity.UpdatedAt,
            user?.Email,
            user?.DisplayName
        );

        return ApiResponse<UserSubscriptionView>.Ok(dto);
    }
}
