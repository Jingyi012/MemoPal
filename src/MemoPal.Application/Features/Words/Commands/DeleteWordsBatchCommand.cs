using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Features.Words.DTOs;
using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Words.Commands;

public sealed record DeleteWordsBatchCommand(string UserId, IReadOnlyList<string> WordIds, bool IsAdmin = false) : IRequest<ApiResponse<int>>;

public sealed class DeleteWordsBatchCommandHandler : IRequestHandler<DeleteWordsBatchCommand, ApiResponse<int>>
{
    private readonly IAppDbContext _db;

    public DeleteWordsBatchCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<int>> Handle(DeleteWordsBatchCommand request, CancellationToken cancellationToken)
    {
        if (request.WordIds.Count == 0) throw new ValidationAppException("WordIds is required.");

        var deleted = 0;
        var now = DateTime.UtcNow;

        foreach (var wordId in request.WordIds)
        {
            var entity = await _db.Words.FirstOrDefaultAsync(x => x.Id == wordId && !x.IsDeleted, cancellationToken);
            if (entity is null) continue;

            var lesson = await _db.Lessons.FirstOrDefaultAsync(
                x => x.Id == entity.LessonId &&
                     !x.IsDeleted &&
                     (request.IsAdmin || (x.IsCustom == true && x.CreatedBy == request.UserId)),
                cancellationToken);
            if (lesson is null) continue;

            entity.IsDeleted = true;
            entity.DeletedAt = now;
            entity.UpdatedAt = now;

            lesson.WordCount = await _db.Words.CountAsync(x => x.LessonId == lesson.Id && !x.IsDeleted, cancellationToken);
            lesson.UpdatedAt = now;

            deleted++;
        }

        if (deleted > 0)
        {
            await _db.SaveChangesAsync(cancellationToken);
        }

        return ApiResponse<int>.Ok(deleted);
    }
}
