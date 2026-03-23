namespace MemoPal.Infrastructure.Auth;

public sealed class SocialAuthOptions
{
    public const string SectionName = "SocialAuth";

    public string? GoogleAudience { get; set; }
    public string? FacebookAppId { get; set; }
    public string? FacebookAppSecret { get; set; }
}
