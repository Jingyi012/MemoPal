using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.SystemSettings.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace MemoPal.Application.Features.SystemSettings.Commands;

public sealed record UpsertSystemSettingCommand(UpsertSystemSettingRequest Request)
    : IRequest<ApiResponse<SystemSettingDto>>;

public sealed class UpsertSystemSettingCommandHandler
    : IRequestHandler<UpsertSystemSettingCommand, ApiResponse<SystemSettingDto>>
{
    private readonly IAppDbContext _db;

    public UpsertSystemSettingCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<SystemSettingDto>> Handle(UpsertSystemSettingCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Request.Key))
            return ApiResponse<SystemSettingDto>.Fail("Key is required.");

        var key = request.Request.Key.Trim();
        var normalizedValue = request.Request.Value ?? string.Empty;
        if (string.Equals(key, SystemSettingKeys.LevelConfigs, StringComparison.Ordinal))
        {
            normalizedValue = NormalizeLevelConfigValue(normalizedValue);
        }

        var entity = await _db.SystemSettings.FirstOrDefaultAsync(x => x.Key == key, cancellationToken);

        if (entity is null)
        {
            entity = new SystemSetting
            {
                Id = Guid.NewGuid().ToString("N"),
                Key = key,
                Value = normalizedValue,
                Description = request.Request.Description,
            };
            _db.SystemSettings.Add(entity);
        }
        else
        {
            entity.Value = normalizedValue;
            entity.Description = request.Request.Description;
            entity.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(cancellationToken);

        if (string.Equals(key, SystemSettingKeys.LevelConfigs, StringComparison.Ordinal))
        {
            var updatedUsers = await _db.RecalculateAllUserLevelsAsync(cancellationToken);
            if (updatedUsers > 0)
            {
                await _db.SaveChangesAsync(cancellationToken);
            }
        }

        return ApiResponse<SystemSettingDto>.Ok(new SystemSettingDto(
            entity.Id,
            entity.Key,
            entity.Value,
            entity.Description,
            entity.CreatedAt,
            entity.UpdatedAt
        ));
    }

    private static string NormalizeLevelConfigValue(string rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            return "{\"levels\":[]}";
        }

        try
        {
            JsonNode? root = JsonNode.Parse(rawValue);
            for (var i = 0; i < 3; i++)
            {
                if (root is not JsonValue valueNode || !valueNode.TryGetValue<string>(out var nestedJson))
                {
                    break;
                }

                if (string.IsNullOrWhiteSpace(nestedJson))
                {
                    break;
                }

                var nested = JsonNode.Parse(nestedJson);
                if (nested is null)
                {
                    break;
                }

                root = nested;
            }

            var source = root switch
            {
                JsonArray direct => direct,
                JsonObject obj when obj["levels"] is JsonArray levels => levels,
                JsonObject obj when obj["configs"] is JsonArray configs => configs,
                _ => new JsonArray()
            };

            var normalized = source
                .OfType<JsonObject>()
                .Select(item =>
                {
                    var level = ToInt(item["level"]);
                    var requiredXp = ToInt(item["requiredXp"]);
                    var title = item["title"]?.GetValue<string>()?.Trim();
                    return new
                    {
                        level = Math.Max(0, level),
                        requiredXp = Math.Max(0, requiredXp),
                        title = string.IsNullOrWhiteSpace(title) ? null : title
                    };
                })
                .Where(item => item.level > 0)
                .OrderBy(item => item.level)
                .ToList();

            return JsonSerializer.Serialize(new
            {
                levels = normalized.Select(item => new
                {
                    item.level,
                    item.requiredXp,
                    item.title
                })
            });
        }
        catch
        {
            return rawValue;
        }
    }

    private static int ToInt(JsonNode? node)
    {
        if (node is null) return 0;

        if (node is JsonValue valueNode)
        {
            if (valueNode.TryGetValue<int>(out var intValue))
            {
                return intValue;
            }

            if (valueNode.TryGetValue<long>(out var longValue))
            {
                return (int)Math.Clamp(longValue, int.MinValue, int.MaxValue);
            }

            if (valueNode.TryGetValue<string>(out var stringValue) &&
                int.TryParse(stringValue, out var parsedString))
            {
                return parsedString;
            }
        }

        return 0;
    }
}
