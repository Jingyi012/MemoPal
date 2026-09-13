using System.Text.Json;
using MemoPal.Application.Common.Settings;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace MemoPal.Infrastructure.AI;

// One snapshot per request/worker scope keeps metering and provider choices consistent.
public sealed class DatabaseAiSettings(AppDbContext db)
{
    private Dictionary<string, string>? values;
    public IOptions<T> Read<T>(string key, IOptionsFactory<T> defaults) where T : class
    {
        values ??= db.SystemSettings.AsNoTracking().Where(x => !x.IsDeleted && x.Key.StartsWith("ai."))
            .ToDictionary(x => x.Key, x => x.Value);
        if (!values.TryGetValue(key, out var json)) return Options.Create(defaults.Create(Options.DefaultName));
        try
        {
            AiSettings.Validate(key, json);
            var settings = JsonSerializer.Deserialize<T>(json, new JsonSerializerOptions(JsonSerializerDefaults.Web))!;
            if (settings is AiTextGenerationOptions text)
            {
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;
                // Compatibility stays at the storage boundary; transports use only generic fields.
                var prefix = text.Provider == "openrouter" ? "openRouter" : text.Provider;
                if (!root.TryGetProperty("model", out _) && root.TryGetProperty(prefix + "Model", out var model))
                    text.Model = model.GetString()!;
                if (!root.TryGetProperty("endpoint", out _) && root.TryGetProperty(prefix + "Endpoint", out var endpoint))
                    text.Endpoint = endpoint.GetString()!;
                if (!root.TryGetProperty("apiKey", out _) && root.TryGetProperty(prefix + "ApiKey", out var apiKey))
                    text.ApiKey = apiKey.GetString()!;
            }
            return Options.Create(settings);
        }
        catch (Exception ex) when (ex is JsonException or ArgumentException or InvalidOperationException)
        {
            // Do not include settings or provider secrets in exception output.
            throw new InvalidOperationException("Invalid database AI configuration. Review Admin System Settings.");
        }
    }
}
