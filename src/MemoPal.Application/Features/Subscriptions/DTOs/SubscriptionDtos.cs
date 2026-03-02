namespace MemoPal.Application.Features.Subscriptions.DTOs;

public sealed record SubscriptionEntitlementDto(
    bool IsPremium,
    string? PlanId,
    string? Provider,
    string? Status,
    DateTime? StartedAt,
    DateTime? ExpiresAt,
    bool AutoRenew,
    DateTime? LastVerifiedAt
);

public sealed class SubscribeRequest
{
    public string PlanId { get; set; } = "premium_monthly";
    public string Provider { get; set; } = "manual";
    public string? ProviderReference { get; set; }
    public int DurationDays { get; set; } = 30;
    public bool AutoRenew { get; set; }
}

public sealed class WebhookSubscriptionEventRequest
{
    public string UserId { get; set; } = string.Empty;
    public string PlanId { get; set; } = "premium_monthly";
    public string Provider { get; set; } = "manual";
    public string? ProviderReference { get; set; }
    public string Status { get; set; } = "active";
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    public bool AutoRenew { get; set; }
}
