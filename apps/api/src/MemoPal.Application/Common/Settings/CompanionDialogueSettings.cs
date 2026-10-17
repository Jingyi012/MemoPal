using MemoPal.Application.Common.Interfaces;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Common.Settings;

public sealed record CompanionDialogueCharacter(string CompanionKey, string PersonalityEn, string PersonalityZh);
public sealed record CompanionDialogueLine(string Id, string? CompanionKey, string Trigger, string? StageKey,
    string TextEn, string TextZh, string Reaction, bool Enabled, int Weight);
public sealed record CompanionDialogueConfig(IReadOnlyList<CompanionDialogueCharacter> Characters,
    IReadOnlyList<CompanionDialogueLine> Lines);

public static class CompanionDialogueSettings
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private static readonly HashSet<string> Triggers = ["tap", "star", "greeting", "practice", "outfit", "bond", "return"];
    private static readonly HashSet<string> Reactions = ["bounce", "tilt", "sparkle", "catch_star"];

    public static CompanionDialogueConfig Defaults { get; } = new(
        [],
        [
            new("tap-1", null, "tap", null, "Hey, you found me!", "嘿，被你发现啦！", "bounce", true, 1),
            new("tap-2", null, "tap", null, "You make my stars wake up.", "你一来，我的星星就醒啦。", "sparkle", true, 1),
            new("tap-3", null, "tap", null, "I was practicing my very best pose.", "我刚才在练习最棒的站姿。", "tilt", true, 1),
            new("star-1", null, "star", null, "Caught it! One more star for our sky.", "接住啦！我们的星空又多一颗星。", "catch_star", true, 1),
            new("greeting-1", null, "greeting", null, "I was just about to wave to you!", "我正准备向你挥手呢！", "bounce", true, 1),
            new("practice-1", null, "practice", null, "We caught that memory together!", "这颗记忆星，我们一起接住啦！", "sparkle", true, 1),
            new("outfit-1", null, "outfit", null, "New look, same brilliant team.", "新造型，还是最棒的搭档。", "tilt", true, 1),
            new("bond-1", null, "bond", null, "Hey, our bond just leveled up!", "嘿，我们的默契升级啦！", "sparkle", true, 1),
            new("return-1", null, "return", null, "You're back! I saved you a star.", "你回来啦！我给你留了一颗星。", "bounce", true, 1),
        ]);

    public static async Task<CompanionDialogueConfig> GetAsync(IAppDbContext db, CancellationToken ct)
    {
        var value = await db.SystemSettings.AsNoTracking()
            .Where(x => x.Key == SystemSettingKeys.CompanionDialogues && !x.IsDeleted)
            .Select(x => x.Value).FirstOrDefaultAsync(ct);
        if (string.IsNullOrWhiteSpace(value)) return Defaults;
        try
        {
            var config = JsonSerializer.Deserialize<CompanionDialogueConfig>(value, JsonOptions);
            return IsValid(config) ? config! : Defaults;
        }
        catch (JsonException) { return Defaults; }
    }

    public static bool IsValid(CompanionDialogueConfig? config) => config is not null &&
        config.Characters is { Count: <= 100 } && config.Lines is { Count: >= 1 and <= 500 } &&
        config.Characters.All(x => x is not null && !string.IsNullOrWhiteSpace(x.CompanionKey) && x.CompanionKey.Length <= 80 &&
            !string.IsNullOrWhiteSpace(x.PersonalityEn) && x.PersonalityEn.Length <= 240 &&
            !string.IsNullOrWhiteSpace(x.PersonalityZh) && x.PersonalityZh.Length <= 240) &&
        config.Characters.Select(x => x.CompanionKey.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).Count() == config.Characters.Count &&
        config.Lines.All(x => x is not null && !string.IsNullOrWhiteSpace(x.Id) && x.Id.Length <= 80 &&
            (x.CompanionKey is null || (x.CompanionKey.Length <= 80 && !string.IsNullOrWhiteSpace(x.CompanionKey))) &&
            !string.IsNullOrWhiteSpace(x.Trigger) && Triggers.Contains(x.Trigger) && (x.StageKey is null || x.StageKey.Length <= 40) &&
            !string.IsNullOrWhiteSpace(x.TextEn) && x.TextEn.Length <= 96 &&
            !string.IsNullOrWhiteSpace(x.TextZh) && x.TextZh.Length <= 48 && !string.IsNullOrWhiteSpace(x.Reaction) && Reactions.Contains(x.Reaction) &&
            x.Weight is >= 1 and <= 100) &&
        config.Lines.Select(x => x.Id.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).Count() == config.Lines.Count;
}
