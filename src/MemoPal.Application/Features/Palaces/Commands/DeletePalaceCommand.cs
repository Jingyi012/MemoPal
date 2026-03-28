using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Security;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Palaces.Commands;

public sealed record DeletePalaceCommand(string UserId, string PalaceId, bool IsAdmin = false) : IRequest<ApiResponse<bool>>;

public sealed class DeletePalaceCommandHandler : IRequestHandler<DeletePalaceCommand, ApiResponse<bool>>
{
    private readonly IAppDbContext _db;

    public DeletePalaceCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<bool>> Handle(DeletePalaceCommand request, CancellationToken cancellationToken)
    {
        var entity = await PalaceAccessPolicy.FindManageablePalaceAsync(
            _db,
            request.PalaceId,
            request.UserId,
            request.IsAdmin,
            cancellationToken);

        if (entity is null) return ApiResponse<bool>.Fail("Palace not found.");

        var now = DateTime.UtcNow;
        entity.IsDeleted = true;
        entity.DeletedAt ??= now;
        entity.UpdatedAt = now;

        var locations = await _db.Locations
            .Where(x => x.PalaceId == entity.Id && !x.IsDeleted)
            .ToListAsync(cancellationToken);
        foreach (var location in locations)
        {
            location.IsDeleted = true;
            location.DeletedAt ??= now;
            location.UpdatedAt = now;
        }

        var lessonIds = await _db.Lessons
            .Where(x => x.PalaceId == entity.Id)
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);

        var lessons = await _db.Lessons
            .Where(x => x.PalaceId == entity.Id && !x.IsDeleted)
            .ToListAsync(cancellationToken);
        foreach (var lesson in lessons)
        {
            lesson.IsDeleted = true;
            lesson.DeletedAt ??= now;
            lesson.UpdatedAt = now;
        }

        if (lessonIds.Count > 0)
        {
            var words = await _db.Words
                .Where(x => lessonIds.Contains(x.LessonId) && !x.IsDeleted)
                .ToListAsync(cancellationToken);
            foreach (var word in words)
            {
                word.IsDeleted = true;
                word.DeletedAt ??= now;
                word.UpdatedAt = now;
            }

            var progresses = await _db.LessonProgresses
                .Where(x => lessonIds.Contains(x.LessonId) && !x.IsDeleted)
                .ToListAsync(cancellationToken);
            var progressIds = progresses.Select(x => x.Id).ToList();
            foreach (var progress in progresses)
            {
                progress.IsDeleted = true;
                progress.DeletedAt ??= now;
                progress.UpdatedAt = now;
            }

            if (progressIds.Count > 0)
            {
                var schedules = await _db.ReviewSchedules
                    .Where(x => progressIds.Contains(x.LessonProgressId) && !x.IsDeleted)
                    .ToListAsync(cancellationToken);
                foreach (var schedule in schedules)
                {
                    schedule.IsDeleted = true;
                    schedule.DeletedAt ??= now;
                    schedule.UpdatedAt = now;
                }
            }
        }

        var userPalaces = await _db.UserPalaces
            .Where(x => x.PalaceId == entity.Id && !x.IsDeleted)
            .ToListAsync(cancellationToken);
        foreach (var userPalace in userPalaces)
        {
            userPalace.IsDeleted = true;
            userPalace.DeletedAt ??= now;
            userPalace.UpdatedAt = now;
        }

        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true);
    }
}
