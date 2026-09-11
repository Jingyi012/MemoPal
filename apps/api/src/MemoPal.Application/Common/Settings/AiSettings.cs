using System.Text.Json;

namespace MemoPal.Application.Common.Settings;

public static class AiSettings
{
    public const string Text = "ai.text";
    public const string Images = "ai.images";
    public const string Credits = "ai.credits";

    public static void Validate(string key, string json)
    {
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        if (root.ValueKind != JsonValueKind.Object) throw new ArgumentException("AI settings must be a JSON object.");
        var strings = key == Text
            ? new[] { "provider", "apiKey", "endpoint", "model", "geminiApiKey", "geminiEndpoint", "geminiModel", "ollamaEndpoint", "ollamaModel" }
            : key == Images ? new[] { "provider", "apiKey", "endpoint", "model" } : [];
        var numbers = key == Text ? new[] { "batchSize", "maxConcurrentRequests", "timeoutSeconds" }
            : key == Credits ? new[] { "textCost", "imageCost" } : [];
        foreach (var field in root.EnumerateObject())
        {
            if (strings.Contains(field.Name))
            {
                if (field.Value.ValueKind != JsonValueKind.String || field.Value.GetString()!.Length > 2000)
                    throw new ArgumentException("Invalid AI text field.");
                var value = field.Value.GetString()!;
                if (field.Name == "provider" && !(key == Text ? new[] { "template", "gemini", "ollama" } : new[] { "gemini" }).Contains(value))
                    throw new ArgumentException("Unsupported AI provider.");
                if (field.Name.EndsWith("Endpoint") || field.Name == "endpoint")
                {
                    if (!Uri.TryCreate(value, UriKind.Absolute, out var uri) ||
                        !(uri.Scheme == "https" || uri.Scheme == "http" && (field.Name == "ollamaEndpoint" ||
                            key == Text && field.Name == "endpoint" && root.TryGetProperty("provider", out var provider) && provider.GetString() == "ollama")) ||
                        !string.IsNullOrEmpty(uri.UserInfo) || !string.IsNullOrEmpty(uri.Query))
                        throw new ArgumentException("AI endpoints must be valid URLs without credentials or query parameters.");
                }
            }
            else if (numbers.Contains(field.Name))
            {
                var max = field.Name == "batchSize" ? 20 : field.Name == "maxConcurrentRequests" ? 10 : field.Name == "timeoutSeconds" ? 120 : 10000;
                var min = field.Name == "timeoutSeconds" ? 5 : 1;
                if (!field.Value.TryGetInt32(out var value) || value < min || value > max)
                    throw new ArgumentException("AI costs and request limits are out of range.");
            }
            else if (key == Credits && field.Name == "imagesEnabled" && field.Value.ValueKind is JsonValueKind.True or JsonValueKind.False) { }
            else throw new ArgumentException("Unknown or invalid AI setting field.");
        }
    }
}
