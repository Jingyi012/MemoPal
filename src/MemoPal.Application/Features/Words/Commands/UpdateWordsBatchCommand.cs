using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Features.Words.DTOs;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Words.Commands;

public sealed record UpdateWordsBatchCommand(string UserId, IReadOnlyList<WordUpsertRequest> Requests, bool IsAdmin = false) : IRequest<ApiResponse<IReadOnlyList<WordDto>>>;

public sealed class UpdateWordsBatchCommandHandler : IRequestHandler<UpdateWordsBatchCommand, ApiResponse<IReadOnlyList<WordDto>>>
{
    private readonly IAppDbContext _db;

    public UpdateWordsBatchCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<WordDto>>> Handle(UpdateWordsBatchCommand request, CancellationToken cancellationToken)
    {
        if (request.Requests.Count == 0) throw new ValidationAppException("Batch payload is empty.");

        var output = new List<WordDto>(request.Requests.Count);
        var now = DateTime.UtcNow;

        foreach (var item in request.Requests)
        {
            Word entity;
            
            if (string.IsNullOrWhiteSpace(item.Id))
            {
                // Create new word
                if (string.IsNullOrWhiteSpace(item.LessonId) ||
                    string.IsNullOrWhiteSpace(item.LocationId) ||
                    string.IsNullOrWhiteSpace(item.Text))
                {
                    throw new ValidationAppException("lessonId, locationId, and text are required.");
                }

                var lesson = await _db.Lessons.FirstOrDefaultAsync(
                    x => x.Id == item.LessonId &&
                         !x.IsDeleted &&
                         (request.IsAdmin || x.IsCustom != true || x.CreatedBy == request.UserId),
                    cancellationToken);
                if (lesson is null) throw new NotFoundAppException("Lesson not found.");

                var locationExists = await _db.Locations.AnyAsync(x => x.Id == item.LocationId && !x.IsDeleted, cancellationToken);
                if (!locationExists) throw new NotFoundAppException("Location not found.");

                var id = Guid.NewGuid().ToString("D");
                entity = new Word
                {
                    Id = id,
                    LessonId = item.LessonId!,
                    LocationId = item.LocationId!,
                    Text = item.Text!.Trim(),
                    Meaning = item.Meaning,
                    CreatedAt = item.CreatedAt ?? now,
                    UpdatedAt = item.UpdatedAt ?? now,
                    IsDeleted = item.IsDeleted ?? false,
                    DeletedAt = item.DeletedAt
                };
                await _db.Words.AddAsync(entity, cancellationToken);

                lesson.WordCount = await _db.Words.CountAsync(x => x.LessonId == lesson.Id && !x.IsDeleted, cancellationToken);
                lesson.UpdatedAt = now;
            }
            else
            {
                // Update existing word
                entity = await _db.Words.FirstOrDefaultAsync(x => x.Id == item.Id && !x.IsDeleted, cancellationToken)
                    ?? throw new NotFoundAppException("Word not found.");

                var lesson = await _db.Lessons.FirstOrDefaultAsync(
                    x => x.Id == entity.LessonId &&
                         !x.IsDeleted &&
                         (request.IsAdmin || x.IsCustom != true || x.CreatedBy == request.UserId),
                    cancellationToken);
                if (lesson is null) throw new NotFoundAppException("Word not found.");

                if (!string.IsNullOrWhiteSpace(item.Text)) entity.Text = item.Text.Trim();
                if (!string.IsNullOrWhiteSpace(item.Meaning)) entity.Meaning = item.Meaning;
                if (!string.IsNullOrWhiteSpace(item.LocationId)) entity.LocationId = item.LocationId;
                entity.UpdatedAt = item.UpdatedAt ?? now;
                entity.IsDeleted = item.IsDeleted ?? entity.IsDeleted;
                entity.DeletedAt = item.DeletedAt ?? entity.DeletedAt;
            }

            output.Add(entity.Adapt<WordDto>());
        }

        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<IReadOnlyList<WordDto>>.Ok(output);
    }
}
