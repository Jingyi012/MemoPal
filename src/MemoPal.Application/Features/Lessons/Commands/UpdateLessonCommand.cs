using Mapster;
using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Lessons.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace MemoPal.Application.Features.Lessons.Commands;

public sealed record UpdateLessonCommand(string UserId, string LessonId, LessonUpsertRequest Request) : IRequest<LessonDto>;

public sealed class UpdateLessonCommandHandler : IRequestHandler<UpdateLessonCommand, LessonDto>
{
    private readonly IAppDbContext _db;

    public UpdateLessonCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<LessonDto> Handle(UpdateLessonCommand request, CancellationToken cancellationToken)
    {
        var lesson = await _db.Lessons.FirstOrDefaultAsync(
                x => x.Id == request.LessonId &&
                     !x.IsDeleted &&
                     (!x.IsCustom.GetValueOrDefault() || x.CreatedBy == request.UserId),
                cancellationToken)
            ?? throw new NotFoundAppException("Lesson not found.");

        if (!string.IsNullOrWhiteSpace(request.Request.Title)) lesson.Title = request.Request.Title.Trim();
        if (!string.IsNullOrWhiteSpace(request.Request.Description)) lesson.Description = request.Request.Description;
        if (!string.IsNullOrWhiteSpace(request.Request.Category)) lesson.Category = request.Request.Category;
        if (request.Request.Tag is not null) lesson.TagJson = JsonSerializer.Serialize(request.Request.Tag);
        lesson.WordCount = request.Request.WordCount;
        lesson.IsCustom = request.Request.IsCustom;
        lesson.IsLocked = request.Request.IsLocked;
        lesson.Completed = request.Request.Completed;
        lesson.IsPremium = request.Request.IsPremium;
        if (!string.IsNullOrWhiteSpace(request.Request.Privacy)) lesson.Privacy = request.Request.Privacy;
        lesson.UpdatedAt = request.Request.UpdatedAt ?? DateTime.UtcNow;
        lesson.LastSyncedAt = request.Request.LastSyncedAt;
        lesson.IsDeleted = request.Request.IsDeleted ?? lesson.IsDeleted;
        lesson.DeletedAt = request.Request.DeletedAt ?? lesson.DeletedAt;

        await _db.SaveChangesAsync(cancellationToken);
        return lesson.Adapt<LessonDto>();
    }
}

