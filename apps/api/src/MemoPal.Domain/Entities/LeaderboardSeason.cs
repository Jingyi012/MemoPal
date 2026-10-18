using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class LeaderboardSeason : AuditableBaseEntity
{
    public string LeaderboardId { get; set; } = "community-weekly";
    public DateTime WeekStartsAtUtc { get; set; }
    public DateTime WeekEndsAtUtc { get; set; }
    public string ConfigJson { get; set; } = string.Empty;
    public string Status { get; set; } = LeaderboardSeasonStatuses.Open;
    public DateTime? SettledAtUtc { get; set; }
}

public static class LeaderboardSeasonStatuses
{
    public const string Open = "open";
    public const string Settling = "settling";
    public const string Settled = "settled";
}
