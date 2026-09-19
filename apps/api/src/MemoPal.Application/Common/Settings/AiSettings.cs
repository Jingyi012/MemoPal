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
            ? new[] { "provider", "apiKey", "endpoint", "model", "geminiApiKey", "geminiEndpoint", "geminiModel", "ollamaEndpoint", "ollamaModel", "openRouterEndpoint", "openRouterModel", "openRouterApiKey" }
            : key == Images ? new[] { "provider", "apiKey", "endpoint", "model" } : [];
        var numbers = key == Text ? new[] { "batchSize", "maxConcurrentRequests", "timeoutSeconds", "maxOutputTokens" }
            : key == Credits ? new[] { "textCost", "imageCost", "customMinCredits", "customMaxCredits", "customStep" } : [];
        foreach (var field in root.EnumerateObject())
        {
            if (strings.Contains(field.Name))
            {
                if (field.Value.ValueKind != JsonValueKind.String || field.Value.GetString()!.Length > 2000)
                    throw new ArgumentException("Invalid AI text field.");
                var value = field.Value.GetString()!;
                if (field.Name == "provider" && !(key == Text ? new[] { "template", "gemini", "ollama", "openrouter" } : new[] { "gemini" }).Contains(value))
                    throw new ArgumentException("Unsupported AI provider.");
                if ((field.Name.EndsWith("Endpoint") || field.Name == "endpoint") && !string.IsNullOrWhiteSpace(value))
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
                var max = field.Name == "maxOutputTokens" ? 32768 : field.Name == "batchSize" ? 20 : field.Name == "maxConcurrentRequests" ? 10 : field.Name == "timeoutSeconds" ? 120 : field.Name.StartsWith("custom", StringComparison.Ordinal) ? 1_000_000 : 10000;
                var min = field.Name == "maxOutputTokens" ? 128 : field.Name == "timeoutSeconds" ? 5 : 1;
                if (!field.Value.TryGetInt32(out var value) || value < min || value > max)
                    throw new ArgumentException("AI costs and request limits are out of range.");
            }
            else if (key == Credits && field.Name is "imagesEnabled" or "purchasesEnabled" or "customPurchaseEnabled" && field.Value.ValueKind is JsonValueKind.True or JsonValueKind.False) { }
            else if (key == Credits && field.Name is "currencyCode" or "currencySymbol")
            {
                if (field.Value.ValueKind != JsonValueKind.String || string.IsNullOrWhiteSpace(field.Value.GetString()) || field.Value.GetString()!.Length > 8)
                    throw new ArgumentException("Invalid credit currency field.");
            }
            else if (key == Credits && field.Name == "pricePerCredit")
            {
                if (!field.Value.TryGetDecimal(out var price) || price <= 0 || price > 10000)
                    throw new ArgumentException("Invalid credit unit price.");
            }
            else if (key == Credits && field.Name == "purchasePacks") ValidatePurchasePacks(field.Value);
            else if (key == Text && field.Name == "reasoningEnabled" && field.Value.ValueKind is JsonValueKind.True or JsonValueKind.False) { }
            else throw new ArgumentException("Unknown or invalid AI setting field.");
        }

        if (key == Credits)
        {
            var min = root.TryGetProperty("customMinCredits", out var minElement) && minElement.TryGetInt32(out var minValue) ? minValue : 50;
            var max = root.TryGetProperty("customMaxCredits", out var maxElement) && maxElement.TryGetInt32(out var maxValue) ? maxValue : 5000;
            var step = root.TryGetProperty("customStep", out var stepElement) && stepElement.TryGetInt32(out var stepValue) ? stepValue : 10;
            if (min > max || step > max) throw new ArgumentException("Invalid custom credit purchase range.");
        }
    }

    private static void ValidatePurchasePacks(JsonElement value)
    {
        if (value.ValueKind != JsonValueKind.Array || value.GetArrayLength() > 20)
            throw new ArgumentException("Credit packs must be an array of at most 20 items.");
        var keys = new HashSet<string>(StringComparer.Ordinal);
        foreach (var pack in value.EnumerateArray())
        {
            if (pack.ValueKind != JsonValueKind.Object) throw new ArgumentException("Invalid credit pack.");
            var allowed = new HashSet<string>(["key", "credits", "price", "label", "badge", "isActive", "sortOrder"], StringComparer.Ordinal);
            if (pack.EnumerateObject().Any(x => !allowed.Contains(x.Name))) throw new ArgumentException("Unknown credit pack field.");
            var key = pack.TryGetProperty("key", out var keyElement) ? keyElement.GetString()?.Trim() : null;
            var label = pack.TryGetProperty("label", out var labelElement) ? labelElement.GetString()?.Trim() : null;
            if (string.IsNullOrWhiteSpace(key) || key.Length > 64 || !keys.Add(key) || string.IsNullOrWhiteSpace(label) || label.Length > 80)
                throw new ArgumentException("Invalid credit pack identity.");
            if (!pack.TryGetProperty("credits", out var credits) || !credits.TryGetInt32(out var creditAmount) || creditAmount is < 1 or > 1_000_000)
                throw new ArgumentException("Invalid credit pack amount.");
            if (!pack.TryGetProperty("price", out var price) || !price.TryGetDecimal(out var priceAmount) || priceAmount <= 0 || priceAmount > 1_000_000)
                throw new ArgumentException("Invalid credit pack price.");
            if (pack.TryGetProperty("badge", out var badge) && badge.ValueKind is not (JsonValueKind.String or JsonValueKind.Null))
                throw new ArgumentException("Invalid credit pack badge.");
            if (pack.TryGetProperty("isActive", out var active) && active.ValueKind is not (JsonValueKind.True or JsonValueKind.False))
                throw new ArgumentException("Invalid credit pack state.");
            if (pack.TryGetProperty("sortOrder", out var order) && (!order.TryGetInt32(out var orderValue) || orderValue is < 0 or > 1000))
                throw new ArgumentException("Invalid credit pack order.");
        }
    }
}
