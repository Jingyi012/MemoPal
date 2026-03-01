using Mapster;
using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Words.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Words.Commands;

public sealed record CreateWordCommand(string UserId, WordUpsertRequest Request) : IRequest<WordDto>;

public sealed class CreateWordCommandHandler : IRequestHandler<CreateWordCommand, WordDto>
{
    private readonly IAppDbContext _db;

    public CreateWordCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<WordDto> Handle(CreateWordCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Request.LessonId) ||
            string.IsNullOrWhiteSpace(request.Request.LocationId) ||
            string.IsNullOrWhiteSpace(request.Request.Text))
        {
            throw new ValidationAppException("lessonId, locationId, and text are required.");
        }

        var lesson = await _db.Lessons.FirstOrDefaultAsync(
            x => x.Id == request.Request.LessonId &&
                 !x.IsDeleted &&
                 (!x.IsCustom.GetValueOrDefault() || x.CreatedBy == request.UserId),
            cancellationToken);
        if (lesson is null) throw new NotFoundAppException("Lesson not found.");

        var locationExists = await _db.Locations.AnyAsync(x => x.Id == request.Request.LocationId && !x.IsDeleted, cancellationToken);
        if (!locationExists) throw new NotFoundAppException("Location not found.");

        var now = DateTime.UtcNow;
        var id = string.IsNullOrWhiteSpace(request.Request.Id) ? Guid.NewGuid().ToString("D") : request.Request.Id!;
        var entity = await _db.Words.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
        {
            entity = new Word
            {
                Id = id,
                CreatedAt = request.Request.CreatedAt ?? now
            };
            await _db.Words.AddAsync(entity, cancellationToken);
        }

        entity.LessonId = request.Request.LessonId!;
        entity.LocationId = request.Request.LocationId!;
        entity.Text = request.Request.Text!.Trim();
        entity.Meaning = request.Request.Meaning;
        entity.UpdatedAt = request.Request.UpdatedAt ?? now;
        entity.LastSyncedAt = request.Request.LastSyncedAt;
        entity.IsDeleted = request.Request.IsDeleted ?? false;
        entity.DeletedAt = request.Request.DeletedAt;

        lesson.WordCount = await _db.Words.CountAsync(x => x.LessonId == lesson.Id && !x.IsDeleted, cancellationToken);
        lesson.UpdatedAt = now;

        await _db.SaveChangesAsync(cancellationToken);
        return entity.Adapt<WordDto>();
    }
}

