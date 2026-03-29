using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Common.Deletion;

internal static class SoftDeleteCascadeHelper
{
    public static async Task SoftDeleteLessonAggregatesAsync(
        IAppDbContext db,
        IReadOnlyCollection<string> lessonIds,
        DateTime now,
        CancellationToken cancellationToken)
    {
        if (lessonIds.Count == 0)
        {
            return;
        }

        var lessons = await db.Lessons
            .Where(x => lessonIds.Contains(x.Id) && !x.IsDeleted)
            .ToListAsync(cancellationToken);
        foreach (var lesson in lessons)
        {
            lesson.IsDeleted = true;
            lesson.DeletedAt ??= now;
            lesson.UpdatedAt = now;
        }

        var words = await db.Words
            .Where(x => lessonIds.Contains(x.LessonId) && !x.IsDeleted)
            .ToListAsync(cancellationToken);
        foreach (var word in words)
        {
            word.IsDeleted = true;
            word.DeletedAt ??= now;
            word.UpdatedAt = now;
        }

        var progresses = await db.LessonProgresses
            .Where(x => lessonIds.Contains(x.LessonId) && !x.IsDeleted)
            .ToListAsync(cancellationToken);
        var progressIds = progresses.Select(x => x.Id).ToList();
        foreach (var progress in progresses)
        {
            progress.IsDeleted = true;
            progress.DeletedAt ??= now;
            progress.UpdatedAt = now;
        }

        if (progressIds.Count == 0)
        {
            return;
        }

        var schedules = await db.ReviewSchedules
            .Where(x => progressIds.Contains(x.LessonProgressId) && !x.IsDeleted)
            .ToListAsync(cancellationToken);
        foreach (var schedule in schedules)
        {
            schedule.IsDeleted = true;
            schedule.DeletedAt ??= now;
            schedule.UpdatedAt = now;
        }
    }

    public static async Task SoftDeleteLocationsByPalaceAsync(
        IAppDbContext db,
        string palaceId,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var locations = await db.Locations
            .Where(x => x.PalaceId == palaceId && !x.IsDeleted)
            .ToListAsync(cancellationToken);
        foreach (var location in locations)
        {
            location.IsDeleted = true;
            location.DeletedAt ??= now;
            location.UpdatedAt = now;
        }
    }

    public static async Task SoftDeleteUserPalaceLinksAsync(
        IAppDbContext db,
        string palaceId,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var userPalaces = await db.UserPalaces
            .Where(x => x.PalaceId == palaceId && !x.IsDeleted)
            .ToListAsync(cancellationToken);
        foreach (var userPalace in userPalaces)
        {
            userPalace.IsDeleted = true;
            userPalace.DeletedAt ??= now;
            userPalace.UpdatedAt = now;
        }
    }
}
