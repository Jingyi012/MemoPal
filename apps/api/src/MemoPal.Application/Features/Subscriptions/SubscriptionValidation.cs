using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Features.Subscriptions.DTOs;
using System.Text.RegularExpressions;

namespace MemoPal.Application.Features.Subscriptions;

internal static class SubscriptionValidation
{
    private const int MaxUserIdLength = 128;
    private const int MaxPlanIdLength = 64;
    private const int MaxProviderLength = 64;
    private const int MaxProviderReferenceLength = 128;
    private const int MaxDurationDays = 3650;

    private static readonly DateTime MinAcceptedDate = new(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc);
    private static readonly HashSet<string> AllowedStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "active",
        "canceled",
        "cancelled",
        "trialing",
        "past_due",
        "inactive",
        "expired",
        "suspended"
    };

    private static readonly Regex SafeToken = new(
        "^[A-Za-z0-9][A-Za-z0-9._:-]*$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    public static void ValidateAndNormalize(SubscribeRequest request)
    {
        if (request is null)
        {
            throw new ValidationAppException("Subscription request is required.");
        }

        request.PlanId = NormalizeRequiredToken(request.PlanId, "planId", MaxPlanIdLength, preserveCase: true);
        request.Provider = NormalizeRequiredToken(request.Provider, "provider", MaxProviderLength, preserveCase: false);
        request.ProviderReference = NormalizeOptionalReference(request.ProviderReference, "providerReference", MaxProviderReferenceLength);

        if (request.DurationDays is < 1 or > MaxDurationDays)
        {
            throw new ValidationAppException($"durationDays must be between 1 and {MaxDurationDays}.");
        }
    }

    public static void ValidateAndNormalize(WebhookSubscriptionEventRequest request)
    {
        if (request is null)
        {
            throw new ValidationAppException("Webhook subscription event is required.");
        }

        request.UserId = NormalizeRequiredToken(request.UserId, "userId", MaxUserIdLength, preserveCase: true);
        request.PlanId = NormalizeRequiredToken(request.PlanId, "planId", MaxPlanIdLength, preserveCase: true);
        request.Provider = NormalizeRequiredToken(request.Provider, "provider", MaxProviderLength, preserveCase: false);
        request.ProviderReference = NormalizeOptionalReference(request.ProviderReference, "providerReference", MaxProviderReferenceLength);
        request.Status = NormalizeAndValidateStatus(request.Status);

        if (request.StartedAt == default)
        {
            throw new ValidationAppException("startedAt is required.");
        }

        var now = DateTime.UtcNow;
        if (request.StartedAt.Kind == DateTimeKind.Unspecified)
        {
            request.StartedAt = DateTime.SpecifyKind(request.StartedAt, DateTimeKind.Utc);
        }

        if (request.StartedAt < MinAcceptedDate || request.StartedAt > now.AddDays(1))
        {
            throw new ValidationAppException("startedAt is out of allowed range.");
        }

        if (request.ExpiresAt.HasValue)
        {
            var expiresAt = request.ExpiresAt.Value;
            if (expiresAt.Kind == DateTimeKind.Unspecified)
            {
                expiresAt = DateTime.SpecifyKind(expiresAt, DateTimeKind.Utc);
                request.ExpiresAt = expiresAt;
            }

            if (expiresAt < request.StartedAt)
            {
                throw new ValidationAppException("expiresAt must be greater than or equal to startedAt.");
            }

            if (expiresAt < MinAcceptedDate || expiresAt > now.AddYears(20))
            {
                throw new ValidationAppException("expiresAt is out of allowed range.");
            }
        }
    }

    private static string NormalizeRequiredToken(string? value, string fieldName, int maxLength, bool preserveCase)
    {
        var normalized = value?.Trim();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw new ValidationAppException($"{fieldName} is required.");
        }

        if (normalized.Length > maxLength)
        {
            throw new ValidationAppException($"{fieldName} must be at most {maxLength} characters.");
        }

        if (!SafeToken.IsMatch(normalized))
        {
            throw new ValidationAppException($"{fieldName} contains invalid characters.");
        }

        return preserveCase ? normalized : normalized.ToLowerInvariant();
    }

    private static string? NormalizeOptionalReference(string? value, string fieldName, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var normalized = value.Trim();
        if (normalized.Length > maxLength)
        {
            throw new ValidationAppException($"{fieldName} must be at most {maxLength} characters.");
        }

        if (normalized.Any(char.IsControl))
        {
            throw new ValidationAppException($"{fieldName} contains invalid characters.");
        }

        return normalized;
    }

    private static string NormalizeAndValidateStatus(string? status)
    {
        var normalized = status?.Trim();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw new ValidationAppException("status is required.");
        }

        normalized = normalized.ToLowerInvariant();
        if (!AllowedStatuses.Contains(normalized))
        {
            throw new ValidationAppException("status must be one of active, canceled, cancelled, trialing, past_due, inactive, expired, or suspended.");
        }

        return normalized;
    }
}
