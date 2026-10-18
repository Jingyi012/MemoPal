using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

/// <summary>A frozen leaderboard row for one published result version. Identity is never returned publicly.</summary>
public sealed class EducationAssignmentLeaderboardEntry : AuditableBaseEntity
{
    public string AssignmentId { get; set; } = string.Empty;
    public DateTime ResultsPublishedAt { get; set; }
    public string StudentUserId { get; set; } = string.Empty;
    public string Alias { get; set; } = string.Empty;
    public bool IsVisibleToStudents { get; set; }
    public int Rank { get; set; }
    public decimal Score { get; set; }
    public decimal MaxScore { get; set; }
}
