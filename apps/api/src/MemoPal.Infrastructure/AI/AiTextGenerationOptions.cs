namespace MemoPal.Infrastructure.AI;

// Runtime snapshot of Admin's ai.text settings, shared by all text generators.
public sealed class AiTextGenerationOptions
{
    public string Provider { get; set; } = "template";
    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string Endpoint { get; set; } = string.Empty;
    public int BatchSize { get; set; } = 12;
    public int MaxConcurrentRequests { get; set; } = 2;
    public int TimeoutSeconds { get; set; } = 45;
    public int MaxOutputTokens { get; set; } = 2048;
    public bool ReasoningEnabled { get; set; }

    public bool IsConfigured => Provider.Trim().ToLowerInvariant() is "gemini" or "ollama" or "openrouter" &&
        !string.IsNullOrWhiteSpace(Model) &&
        (Provider.Trim().Equals("ollama", StringComparison.OrdinalIgnoreCase) || !string.IsNullOrWhiteSpace(ApiKey)) &&
        Uri.TryCreate(Endpoint, UriKind.Absolute, out var uri) &&
        (uri.Scheme == Uri.UriSchemeHttps || uri.Scheme == Uri.UriSchemeHttp && Provider.Trim().Equals("ollama", StringComparison.OrdinalIgnoreCase)) &&
        string.IsNullOrEmpty(uri.UserInfo) && string.IsNullOrEmpty(uri.Query);
}
