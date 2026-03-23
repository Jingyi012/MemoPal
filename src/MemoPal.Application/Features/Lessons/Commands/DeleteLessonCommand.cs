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
                 (request.IsAdmin || x.IsCustom != true || x.CreatedBy == request.UserId),
            cancellationToken);

        if (lesson is null) return ApiResponse<bool>.Ok(false);

        lesson.IsDeleted = true;
        lesson.DeletedAt = DateTime.UtcNow;
        lesson.UpdatedAt = DateTime.UtcNow;

        var words = await _db.Words.Where(x => x.LessonId == lesson.Id && !x.IsDeleted).ToListAsync(cancellationToken);
        foreach (var word in words)
        {
            word.IsDeleted = true;
            word.DeletedAt = DateTime.UtcNow;
            word.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true);
    }
}
