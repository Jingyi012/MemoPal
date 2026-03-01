using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class LessonProgress : UserOwnedSyncEntity
{
    public string LessonId { get; set; } = string.Empty;
    public DateTime? FirstCompletedDate { get; set; }
    public int TotalReviews { get; set; }
    public string MasteryLevel { get; set; } = "new";
    public DateTime? LastReviewDate { get; set; }
    public int XpEarned { get; set; }

    public Lesson? Lesson { get; set; }
    public ICollection<ReviewSchedule> ReviewSchedules { get; set; } = new List<ReviewSchedule>();
}

