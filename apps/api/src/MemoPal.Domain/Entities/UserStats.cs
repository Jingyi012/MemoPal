using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class UserStats : AuditableBaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public int LessonsCompleted { get; set; }
    public int WordsLearned { get; set; }
    public int CurrentStreak { get; set; }
    public int LongestStreak { get; set; }
    public DateTime? LastActiveDate { get; set; }
    public User? User { get; set; }
}

