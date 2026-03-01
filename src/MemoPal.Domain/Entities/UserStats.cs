namespace MemoPal.Domain.Entities;

public sealed class UserStats
{
    public string UserId { get; set; } = string.Empty;
    public int LessonsCompleted { get; set; }
    public int WordsLearned { get; set; }
    public int CurrentStreak { get; set; }
    public int LongestStreak { get; set; }
    public DateTime? LastActiveDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastSyncedAt { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }

    public User? User { get; set; }
}

