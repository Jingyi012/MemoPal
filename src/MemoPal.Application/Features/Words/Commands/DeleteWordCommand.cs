using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Words.Commands;

public sealed record DeleteWordCommand(string UserId, string WordId, bool IsAdmin = false) : IRequest<ApiResponse<bool>>;

public sealed class DeleteWordCommandHandler : IRequestHandler<DeleteWordCommand, ApiResponse<bool>>
{
    private readonly IAppDbContext _db;

    public DeleteWordCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<bool>> Handle(DeleteWordCommand request, CancellationToken cancellationToken)
    {
        var entity = await _db.Words.FirstOrDefaultAsync(x => x.Id == request.WordId && !x.IsDeleted, cancellationToken);
        if (entity is null) return ApiResponse<bool>.Ok(false);

        var lesson = await _db.Lessons.FirstOrDefaultAsync(
            x => x.Id == entity.LessonId &&
                 !x.IsDeleted &&
                 (request.IsAdmin || x.IsCustom != true || x.CreatedBy == request.UserId),
            cancellationToken);
        if (lesson is null) return ApiResponse<bool>.Ok(false);

        entity.IsDeleted = true;
        entity.DeletedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;

        lesson.WordCount = await _db.Words.CountAsync(x => x.LessonId == lesson.Id && !x.IsDeleted, cancellationToken);
        lesson.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true);
    }
}

