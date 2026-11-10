using System.Globalization;
using System.Text;
using System.Text.Json;
using MemoPal.Application.Features.Referrals.DTOs;

namespace MemoPal.Application.Features.Referrals;

public static class ReferralProgramConfigSerializer
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public static ReferralProgramConfigDto ParseOrDefault(string? rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            return GetDefault();
        }

        try
        {
            var config = JsonSerializer.Deserialize<ReferralProgramConfigDto>(rawValue, JsonOptions);
            // Old settings contain XP amounts. Keep those historical records as XP;
            // only future rewards switch to the same number of AI credits.
            using var document = JsonDocument.Parse(rawValue);
            if (config is not null)
            {
                var root = document.RootElement;
                if (!HasProperty(root, "inviterRewardAiCredits") && HasProperty(root, "inviterRewardXp"))
                    config.InviterRewardAiCredits = config.InviterRewardXp;
                if (!HasProperty(root, "inviteeRewardAiCredits") && HasProperty(root, "inviteeRewardXp"))
                    config.InviteeRewardAiCredits = config.InviteeRewardXp;
                var milestones = root.EnumerateObject()
                    .FirstOrDefault(x => x.Name.Equals("milestones", StringComparison.OrdinalIgnoreCase)).Value;
                foreach (var milestone in config.Milestones ?? [])
                {
                    if (milestone is null || milestones.ValueKind != JsonValueKind.Array) continue;
                    var legacy = milestones.EnumerateArray().Any(x => x.ValueKind == JsonValueKind.Object
                        && x.EnumerateObject().Any(p => p.Name.Equals("key", StringComparison.OrdinalIgnoreCase)
                            && p.Value.GetString() == milestone.Key)
                        && !HasProperty(x, "rewardAiCredits"));
                    if (legacy) milestone.RewardAiCredits = milestone.RewardXp;
                }
            }
            return Normalize(config ?? new ReferralProgramConfigDto());
        }
        catch (JsonException)
        {
            return GetDefault();
        }
    }

    public static string Serialize(ReferralProgramConfigDto config)
    {
        return JsonSerializer.Serialize(Normalize(config), JsonOptions);
    }

    public static ReferralProgramConfigDto Normalize(ReferralProgramConfigDto config)
    {
        var normalized = new ReferralProgramConfigDto
        {
            IsEnabled = config.IsEnabled,
            InviterRewardXp = 0,
            InviterRewardAiCredits = Math.Clamp(config.InviterRewardAiCredits, 0, 1_000_000),
            InviterRewardPremiumDays = Math.Max(0, config.InviterRewardPremiumDays),
            InviteeRewardXp = 0,
            InviteeRewardAiCredits = Math.Clamp(config.InviteeRewardAiCredits, 0, 1_000_000),
            InviteeRewardPremiumDays = Math.Max(0, config.InviteeRewardPremiumDays),
            MaxSuccessfulReferralsPerUser = Math.Max(0, config.MaxSuccessfulReferralsPerUser),
            Milestones = NormalizeMilestones(config.Milestones ?? [])
        };

        if (normalized.Milestones.Count == 0)
        {
            normalized.Milestones = GetDefault().Milestones;
        }

        return normalized;
    }

    public static ReferralProgramConfigDto GetDefault()
    {
        return new ReferralProgramConfigDto
        {
            IsEnabled = true,
            InviterRewardAiCredits = 80,
            InviterRewardPremiumDays = 3,
            InviteeRewardAiCredits = 40,
            InviteeRewardPremiumDays = 2,
            MaxSuccessfulReferralsPerUser = 100,
            Milestones =
            [
                new ReferralMilestoneConfigDto
                {
                    Key = "referral_1",
                    Title = "First Invite",
                    ReferralsRequired = 1,
                    RewardAiCredits = 100,
                    RewardPremiumDays = 3,
                    IsActive = true,
                    SortOrder = 1
                },
                new ReferralMilestoneConfigDto
                {
                    Key = "referral_3",
                    Title = "Community Starter",
                    ReferralsRequired = 3,
                    RewardAiCredits = 250,
                    RewardPremiumDays = 7,
                    IsActive = true,
                    SortOrder = 2
                },
                new ReferralMilestoneConfigDto
                {
                    Key = "referral_5",
                    Title = "Memory Ambassador",
                    ReferralsRequired = 5,
                    RewardAiCredits = 500,
                    RewardPremiumDays = 14,
                    IsActive = true,
                    SortOrder = 3
                },
                new ReferralMilestoneConfigDto
                {
                    Key = "referral_10",
                    Title = "Master Connector",
                    ReferralsRequired = 10,
                    RewardAiCredits = 1000,
                    RewardPremiumDays = 30,
                    IsActive = true,
                    SortOrder = 4
                }
            ]
        };
    }

    private static IReadOnlyList<ReferralMilestoneConfigDto> NormalizeMilestones(IEnumerable<ReferralMilestoneConfigDto> milestones)
    {
        var result = new List<ReferralMilestoneConfigDto>();
        var seenKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var sortOrder = 1;

        foreach (var item in milestones)
        {
            if (item is null)
            {
                continue;
            }

            var referralsRequired = Math.Max(1, item.ReferralsRequired);
            var key = string.IsNullOrWhiteSpace(item.Key)
                ? $"referral_{referralsRequired}"
                : Slugify(item.Key);

            if (string.IsNullOrWhiteSpace(key) || !seenKeys.Add(key))
            {
                continue;
            }

            var title = string.IsNullOrWhiteSpace(item.Title)
                ? $"Referral {referralsRequired}"
                : item.Title.Trim();

            result.Add(new ReferralMilestoneConfigDto
            {
                Key = key,
                Title = title,
                ReferralsRequired = referralsRequired,
                RewardXp = 0,
                RewardAiCredits = Math.Clamp(item.RewardAiCredits, 0, 1_000_000),
                RewardPremiumDays = Math.Max(0, item.RewardPremiumDays),
                RewardLabel = string.IsNullOrWhiteSpace(item.RewardLabel)
                    || System.Text.RegularExpressions.Regex.IsMatch(item.RewardLabel, @"\bXP\b", System.Text.RegularExpressions.RegexOptions.IgnoreCase)
                    ? null : item.RewardLabel.Trim(),
                IsActive = item.IsActive,
                SortOrder = item.SortOrder > 0 ? item.SortOrder : sortOrder
            });

            sortOrder++;
        }

        return result
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.ReferralsRequired)
            .Select((x, index) =>
            {
                x.SortOrder = index + 1;
                return x;
            })
            .ToList();
    }

    private static bool HasProperty(JsonElement element, string name) =>
        element.ValueKind == JsonValueKind.Object && element.EnumerateObject()
            .Any(x => x.Name.Equals(name, StringComparison.OrdinalIgnoreCase));

    private static string Slugify(string input)
    {
        var text = input.Trim().ToLowerInvariant();
        var buffer = new StringBuilder(text.Length);

        foreach (var ch in text.Normalize(NormalizationForm.FormD))
        {
            if (CharUnicodeInfo.GetUnicodeCategory(ch) == UnicodeCategory.NonSpacingMark)
            {
                continue;
            }

            if (char.IsLetterOrDigit(ch))
            {
                buffer.Append(ch);
                continue;
            }

            if (buffer.Length > 0 && buffer[^1] != '_')
            {
                buffer.Append('_');
            }
        }

        return buffer.ToString().Trim('_');
    }
}
