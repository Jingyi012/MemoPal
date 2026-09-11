namespace MemoPal.Infrastructure.AI;

public sealed class AiImageGenerationOptions
{
    public const string SectionName = "AI:Images";
    // Only the Gemini image transport is currently implemented.
    public string Provider { get; set; } = "gemini";
    public string Model { get; set; } = "";
    public string ApiKey { get; set; } = "";
    public string Endpoint { get; set; } = "https://generativelanguage.googleapis.com/v1beta";

    public bool IsConfigured => Provider.Equals("gemini", StringComparison.OrdinalIgnoreCase) &&
        !string.IsNullOrWhiteSpace(Model) && !string.IsNullOrWhiteSpace(ApiKey) &&
        Uri.TryCreate(Endpoint, UriKind.Absolute, out var uri) && uri.Scheme == Uri.UriSchemeHttps;
}
