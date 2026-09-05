namespace MemoPal.Infrastructure.AI;

public sealed class PalaceAssociationGenerationOptions
{
    public const string SectionName = "AI:PalaceAssociations";

    /// <summary>
    /// Supported values are template, gemini, and ollama. Template keeps the
    /// feature usable when no external AI credentials are configured.
    /// </summary>
    public string Provider { get; set; } = "template";
    public string GeminiApiKey { get; set; } = string.Empty;
    public string GeminiEndpoint { get; set; } = "https://generativelanguage.googleapis.com/v1beta";
    public string GeminiModel { get; set; } = "gemini-3.5-flash-lite";
    public string OllamaEndpoint { get; set; } = "http://localhost:11434/api/chat";
    public string OllamaModel { get; set; } = "qwen3:8b";
    public int BatchSize { get; set; } = 12;
    public int MaxConcurrentRequests { get; set; } = 2;
    public int TimeoutSeconds { get; set; } = 45;
}
