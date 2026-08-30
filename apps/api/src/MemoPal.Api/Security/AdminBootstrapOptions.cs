namespace MemoPal.Api.Security;

public sealed class AdminBootstrapOptions
{
    public const string SectionName = "AdminBootstrap";

    public bool Enabled { get; set; }
    public bool SeedGamificationMockData { get; set; }
    public bool SeedStarterContent { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string DisplayName { get; set; } = "Admin";
}
