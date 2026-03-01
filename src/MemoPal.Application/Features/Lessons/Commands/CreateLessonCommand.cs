using Mapster;
using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Lessons.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace MemoPal.Application.Features.Lessons.Commands;

public sealed record CreateLessonCommand(string UserId, LessonUpsertRequest Request) : IRequest<LessonDto>;

public sealed class CreateLessonCommandHandler : IRequestHandler<CreateLessonCommand, LessonDto>
{
    private readonly IAppDbContext _db;

    public CreateLessonCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<LessonDto> Handle(CreateLessonCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Request.PalaceId) || string.IsNullOrWhiteSpace(request.Request.Title))
        {
            throw new ValidationAppException("palaceId and title are required.");
        }

        var palace = await _db.Palaces.FirstOrDefaultAsync(
            x => x.Id == request.Request.PalaceId && !x.IsDeleted && (!x.IsCustom || x.CreatedBy == request.UserId),
            cancellationToken);
        if (palace is null) throw new NotFoundAppException("Palace not found.");

        var now = DateTime.UtcNow;
        var id = string.IsNullOrWhiteSpace(request.Request.Id) ? Guid.NewGuid().ToString("D") : request.Request.Id!;
        var lesson = await _db.Lessons.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (lesson is null)
        {
            lesson = new Lesson
            {
                Id = id,
                CreatedAt = request.Request.CreatedAt ?? now
            };
            await _db.Lessons.AddAsync(lesson, cancellationToken);
        }

        lesson.PalaceId = request.Request.PalaceId!;
        lesson.Title = request.Request.Title!.Trim();
        lesson.Description = request.Request.Description;
        lesson.WordCount = request.Request.WordCount;
        lesson.Category = request.Request.Category;
        lesson.TagJson = request.Request.Tag is null ? null : JsonSerializer.Serialize(request.Request.Tag);
        lesson.IsCustom = request.Request.IsCustom;
        lesson.IsLocked = request.Request.IsLocked;
        lesson.Completed = request.Request.Completed;
        lesson.IsPremium = request.Request.IsPremium;
        lesson.Privacy = string.IsNullOrWhiteSpace(request.Request.Privacy) ? "private" : request.Request.Privacy;
        lesson.CreatedBy = request.Request.IsCustom.GetValueOrDefault() ? request.UserId : request.Request.CreatedBy;
        lesson.UpdatedAt = request.Request.UpdatedAt ?? now;
        lesson.LastSyncedAt = request.Request.LastSyncedAt;
        lesson.IsDeleted = request.Request.IsDeleted ?? false;
        lesson.DeletedAt = request.Request.DeletedAt;

        await _db.SaveChangesAsync(cancellationToken);
        return lesson.Adapt<LessonDto>();
    }
}

