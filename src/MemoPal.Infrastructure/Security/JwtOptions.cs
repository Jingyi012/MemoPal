namespace MemoPal.Infrastructure.Security;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "MemoPal";
    public string Audience { get; set; } = "MemoPal.Mobile";
    public string Secret { get; set; } = "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_KEY_AT_LEAST_32_CHARS";
    public int ExpiryMinutes { get; set; } = 10080;
}
