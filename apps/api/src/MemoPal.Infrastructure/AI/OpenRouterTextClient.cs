using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Diagnostics;

namespace MemoPal.Infrastructure.AI;

internal static class OpenRouterTextClient
{
    public static async Task<string> GenerateAsync(HttpClient client, AiTextGenerationOptions settings,
        string prompt, CancellationToken ct)
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeout.CancelAfter(TimeSpan.FromSeconds(Math.Clamp(settings.TimeoutSeconds, 5, 120)));
        var callerToken = ct;
        ct = timeout.Token;
        var elapsed = Stopwatch.StartNew();
        var phase = "waiting-for-headers";
        int? statusCode = null;
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, settings.Endpoint);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", settings.ApiKey.Trim());
            request.Content = JsonContent.Create(new
            {
                model = settings.Model.Trim(),
                stream = false,
                response_format = new { type = "json_object" },
                max_tokens = Math.Clamp(settings.MaxOutputTokens, 128, 32768),
                // Short mnemonic text needs a final answer, not the provider's default
                // extended reasoning. Admin can explicitly enable it when needed.
                reasoning = new { enabled = settings.ReasoningEnabled },
                messages = new[] { new { role = "user", content = prompt } }
            });
            // Receive headers separately so a 200 followed by a stalled response
            // body can be distinguished from never receiving a response.
            using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct);
            statusCode = (int)response.StatusCode;
            phase = "reading-body";
            response.EnsureSuccessStatusCode();
            JsonElement body;
            try { body = await response.Content.ReadFromJsonAsync<JsonElement>(ct); }
            catch (JsonException ex)
            {
                ex.Data["ResponseLayer"] = "provider-envelope";
                throw;
            }
            // Error payloads can also arrive with HTTP 200. Never expose their raw contents.
            if (body.ValueKind == JsonValueKind.Object && !body.TryGetProperty("error", out _) &&
                body.TryGetProperty("choices", out var choices) && choices.ValueKind == JsonValueKind.Array &&
                choices.GetArrayLength() > 0 && choices[0].ValueKind == JsonValueKind.Object &&
                choices[0].TryGetProperty("message", out var message) && message.ValueKind == JsonValueKind.Object &&
                message.TryGetProperty("content", out var content) && content.ValueKind == JsonValueKind.String &&
                !string.IsNullOrWhiteSpace(content.GetString()))
            {
                // HTTP 200 does not mean the model finished producing the JSON.
                if (choices[0].TryGetProperty("finish_reason", out var reason) && reason.ValueKind == JsonValueKind.String &&
                    reason.GetString() is "length" or "content_filter" or "error")
                {
                    var error = new InvalidOperationException("OpenRouter did not finish the text completion.");
                    error.Data["ResponseLayer"] = "model-completion";
                    error.Data["FinishReason"] = reason.GetString();
                    throw error;
                }
                return content.GetString()!;
            }
            throw new InvalidOperationException("OpenRouter returned no text completion.");
        }
        catch (OperationCanceledException ex) when (!callerToken.IsCancellationRequested)
        {
            // Only fixed diagnostic fields; never attach keys, prompts, or response bodies.
            ex.Data["CancellationSource"] = timeout.IsCancellationRequested ? "configured-request-deadline" : "http-transport";
            ex.Data["Phase"] = phase;
            ex.Data["ElapsedMs"] = elapsed.ElapsedMilliseconds;
            ex.Data["TimeoutSeconds"] = Math.Clamp(settings.TimeoutSeconds, 5, 120);
            ex.Data["ResponseStatus"] = statusCode;
            throw;
        }
    }
}
