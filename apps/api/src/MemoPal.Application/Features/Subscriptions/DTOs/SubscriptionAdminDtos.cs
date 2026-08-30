namespace MemoPal.Application.Features.Subscriptions.DTOs;

public sealed record AdminUserSubscriptionDto(
    string Id,
    string UserId,
    string PlanId,
    string Provider,
    string? ProviderReference,
    string Status,
    DateTime StartedAt,
    DateTime? ExpiresAt,
    bool AutoRenew,
    DateTime? LastVerifiedAt,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public sealed class AdminSubscriptionFilter
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public string? Status { get; set; }
}

public sealed class AdminUpdateSubscriptionRequest
{
    public string? Status { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool? AutoRenew { get; set; }
    public DateTime? LastVerifiedAt { get; set; }
}
