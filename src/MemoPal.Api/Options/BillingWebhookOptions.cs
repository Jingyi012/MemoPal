namespace MemoPal.Api.Options;

public sealed class BillingWebhookOptions
{
    public const string SectionName = "BillingWebhook";

    public string? Secret { get; set; }
}
