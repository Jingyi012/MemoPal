using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Lessons.Commands;

public sealed record DeleteLessonCommand(string UserId, string LessonId, bool IsAdmin = false) : IRequest<ApiResponse<bool>>;

public sealed class DeleteLessonCommandHandler : IRequestHandler<DeleteLessonCommand, ApiResponse<bool>>
{
    private readonly IAppDbContext _db;

    public DeleteLessonCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<bool>> Handle(DeleteLessonCommand request, CancellationToken cancellationToken)
    {
        var lesson = await _db.Lessons.FirstOrDefaultAsync(
            x => x.Id == request.LessonId &&
                 !x.IsDeleted &&
                 (request.IsAdmin || (x.IsCustom == true && x.CreatedBy == request.UserId)),
            cancellationToken);

        if (lesson is null) return ApiResponse<bool>.Ok(false);

        var now = DateTime.UtcNow;
        lesson.IsDeleted = true;
        lesson.DeletedAt = now;
        lesson.UpdatedAt = now;

        var words = await _db.Words.Where(x => x.LessonId == lesson.Id && !x.IsDeleted).ToListAsync(cancellationToken);
        foreach (var word in words)
        {
            word.IsDeleted = true;
            word.DeletedAt ??= now;
            word.UpdatedAt = now;
        }

        var progresses = await _db.LessonProgresses
            .Where(x => x.LessonId == lesson.Id && !x.IsDeleted)
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

        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true);
    }
}
