using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Words.Commands;

internal static class WordCountSyncHelper
{
    public static async Task RecalculateLessonWordCountsAsync(
        IAppDbContext db,
        IEnumerable<string> lessonIds,
        DateTime updatedAtUtc,
        CancellationToken cancellationToken)
    {
        var distinctLessonIds = lessonIds
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        if (distinctLessonIds.Length == 0)
        {
            return;
        }

        var countsByLessonId = await db.Words
            .Where(x => distinctLessonIds.Contains(x.LessonId) && !x.IsDeleted)
            .GroupBy(x => x.LessonId)
            .Select(x => new { LessonId = x.Key, Count = x.Count() })
            .ToDictionaryAsync(x => x.LessonId, x => x.Count, cancellationToken);

        var lessons = await db.Lessons
            .Where(x => distinctLessonIds.Contains(x.Id) && !x.IsDeleted)
            .ToListAsync(cancellationToken);

        foreach (var lesson in lessons)
        {
            lesson.WordCount = countsByLessonId.TryGetValue(lesson.Id, out var count) ? count : 0;
            lesson.UpdatedAt = updatedAtUtc;
        }
    }
}

