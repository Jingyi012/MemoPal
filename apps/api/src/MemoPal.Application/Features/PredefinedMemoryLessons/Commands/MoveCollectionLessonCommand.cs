using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.PredefinedMemoryLessons.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.PredefinedMemoryLessons.Commands;

public sealed record MoveCollectionLessonRequest(string? SourceCollectionId, string? TargetCollectionId,
    int? ExpectedSourceVersion, int? ExpectedTargetVersion, int ExpectedLessonVersion);
public sealed record MoveCollectionLessonCommand(string LessonId, MoveCollectionLessonRequest Request)
    : IRequest<ApiResponse<bool>>;

public sealed class MoveCollectionLessonCommandHandler(IAppDbContext db)
    : IRequestHandler<MoveCollectionLessonCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(MoveCollectionLessonCommand command, CancellationToken ct)
    {
        var input = command.Request;
        if (input.SourceCollectionId == input.TargetCollectionId)
            throw new ValidationAppException("Choose a different destination.");
        var lesson = await db.PredefinedMemoryLessons.Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.Id == command.LessonId && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("Lesson not found.");
        if (lesson.Version != input.ExpectedLessonVersion)
            throw new ConflictAppException("This lesson changed. Reload before moving.");
        var source = await Load(input.SourceCollectionId, input.ExpectedSourceVersion, ct);
        var target = await Load(input.TargetCollectionId, input.ExpectedTargetVersion, ct);
        if (source is not null && !source.Lessons.Any(x => x.LessonId == lesson.Id))
            throw new ConflictAppException("This lesson is no longer in the source collection. Reload before moving.");
        if (source is null && await db.PredefinedMemoryCollections.AnyAsync(
                x => !x.IsDeleted && x.Lessons.Any(m => m.LessonId == lesson.Id), ct))
            throw new ConflictAppException("This lesson already belongs to a collection. Reload and choose its source.");
        if (target is not null)
        {
            if (target.Lessons.Any(x => x.LessonId == lesson.Id))
                throw new ValidationAppException("This lesson is already in the destination collection.");
            if (target.Lessons.Count(x => !x.Lesson.IsDeleted) >= 100)
                throw new ValidationAppException("A collection can contain at most 100 lessons.");
            if (target.IsPublished && !PredefinedMemoryCollectionQuery.IsAvailable(lesson))
                throw new ValidationAppException("Publish the lesson and activate its category before moving it into a published collection.");
        }
        if (source is { IsPublished: true } && source.Lessons.Count(x => !x.Lesson.IsDeleted) == 1)
            throw new ValidationAppException("Unpublish the source collection before moving its last lesson.");

        if (source is not null)
        {
            source.Lessons.Remove(source.Lessons.Single(x => x.LessonId == lesson.Id));
            var position = 1;
            foreach (var membership in source.Lessons.OrderBy(x => x.Position)) membership.Position = position++;
            source.Version++;
        }
        if (target is not null)
        {
            target.Lessons.Add(new() { CollectionId = target.Id, LessonId = lesson.Id, Lesson = lesson,
                Position = target.Lessons.Select(x => x.Position).DefaultIfEmpty(0).Max() + 1 });
            target.Version++;
        }
        // Serialize competing moves of an unassigned lesson as well as collection edits.
        lesson.Version++;
        await ContentLibraryPersistence.SaveChangesAsync(db, ct);
        return ApiResponse<bool>.Ok(true);
    }

    private async Task<PredefinedMemoryCollection?> Load(string? id, int? version, CancellationToken ct)
    {
        if (id is null) return null;
        var collection = await db.PredefinedMemoryCollections.WithLessons()
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("Collection not found.");
        if (version != collection.Version)
            throw new ConflictAppException("A collection changed. Reload before moving.");
        return collection;
    }
}
