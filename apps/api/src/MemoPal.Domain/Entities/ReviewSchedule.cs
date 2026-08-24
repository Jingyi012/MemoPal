using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class ReviewSchedule : UserOwnedSyncEntity
{
    public string LessonProgressId { get; set; } = string.Empty;
    public int ReviewRound { get; set; }
    public DateTime DueDate { get; set; }
    public bool Completed { get; set; }
    public DateTime? CompletedDate { get; set; }

    public LessonProgress? LessonProgress { get; set; }
}

