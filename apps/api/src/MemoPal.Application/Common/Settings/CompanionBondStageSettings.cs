using System.Text.Json;
using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Common.Settings;

public static class CompanionBondStageSettings
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static async Task<IReadOnlyList<CompanionBondStageConfig>> GetAsync(IAppDbContext db, CancellationToken ct)
    {
        var value = await db.SystemSettings.AsNoTracking()
            .Where(x => x.Key == SystemSettingKeys.CompanionBondStages && !x.IsDeleted)
            .Select(x => x.Value).FirstOrDefaultAsync(ct);
        if (string.IsNullOrWhiteSpace(value)) return CompanionBondStageDefaults.All;
        try
        {
            var stages = JsonSerializer.Deserialize<List<CompanionBondStageConfig>>(value, JsonOptions);
            return IsValid(stages) ? stages! : CompanionBondStageDefaults.All;
        }
        catch (JsonException) { return CompanionBondStageDefaults.All; }
    }

    public static bool IsValid(IReadOnlyList<CompanionBondStageConfig>? stages) => stages is { Count: >= 2 and <= 10 } &&
        stages[0].Points == 0 && stages.Select(x => x.Key.Replace('_', '-')).Distinct(StringComparer.OrdinalIgnoreCase).Count() == stages.Count &&
        stages.Zip(stages.Skip(1), (left, right) => right.Points > left.Points).All(x => x) &&
        stages.All(x => !string.IsNullOrWhiteSpace(x.Key) && x.Key.Length <= 40 && x.Points >= 0 &&
                        !string.IsNullOrWhiteSpace(x.TitleEn) && x.TitleEn.Length <= 80 &&
                        !string.IsNullOrWhiteSpace(x.TitleZh) && x.TitleZh.Length <= 80 &&
                        (x.Key == stages[0].Key || (!string.IsNullOrWhiteSpace(x.MessageEn) && x.MessageEn.Length <= 160 &&
                                                    !string.IsNullOrWhiteSpace(x.MessageZh) && x.MessageZh.Length <= 160)));
}
