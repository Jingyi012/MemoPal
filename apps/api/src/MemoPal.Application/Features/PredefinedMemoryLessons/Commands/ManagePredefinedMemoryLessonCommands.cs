using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.PredefinedMemoryLessons.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.PredefinedMemoryLessons.Commands;

public sealed record CreatePredefinedMemoryLessonCommand(PredefinedMemoryLessonUpsertRequest Request)
    : IRequest<ApiResponse<PredefinedMemoryLessonDto>>;
public sealed record UpdatePredefinedMemoryLessonCommand(string LessonId, PredefinedMemoryLessonUpsertRequest Request)
    : IRequest<ApiResponse<PredefinedMemoryLessonDto>>;
public sealed record DeletePredefinedMemoryLessonCommand(string LessonId) : IRequest<ApiResponse<bool>>;

public sealed class CreatePredefinedMemoryLessonCommandHandler(IAppDbContext db)
    : IRequestHandler<CreatePredefinedMemoryLessonCommand, ApiResponse<PredefinedMemoryLessonDto>>
{
    public async Task<ApiResponse<PredefinedMemoryLessonDto>> Handle(
        CreatePredefinedMemoryLessonCommand request,
        CancellationToken cancellationToken)
    {
        PredefinedMemoryLessonAggregate.Validate(request.Request);
        var category = await db.PredefinedMemoryLessonCategories.FirstOrDefaultAsync(
            x => x.Id == request.Request.CategoryId && !x.IsDeleted,
            cancellationToken) ?? throw new ValidationAppException("The selected lesson category does not exist.");
        await PredefinedMemoryLessonValidation.ValidatePalaceSceneAsync(db, request.Request, cancellationToken);
        if (request.Request.IsPublished && !category.IsActive)
            throw new ValidationAppException("Activate the selected category before publishing this lesson.");
        var key = request.Request.Key.Trim();
        if (await db.PredefinedMemoryLessons.AnyAsync(x => x.Key == key && !x.IsDeleted, cancellationToken))
            throw new ConflictAppException("A lesson with this key already exists.");

        var lesson = PredefinedMemoryLessonAggregate.Create(request.Request);
        lesson.Category = category;
        if (request.Request.CollectionId is { } collectionId)
        {
            var collection = await db.PredefinedMemoryCollections.WithLessons()
                .FirstOrDefaultAsync(x => x.Id == collectionId && !x.IsDeleted, cancellationToken)
                ?? throw new NotFoundAppException("Collection not found.");
            if (request.Request.ExpectedCollectionVersion != collection.Version)
                throw new ConflictAppException("This collection changed. Reload before adding a lesson.");
            if (collection.Lessons.Count(x => !x.Lesson.IsDeleted) >= 100)
                throw new ValidationAppException("A collection can contain at most 100 lessons.");
            if (collection.IsPublished && !PredefinedMemoryCollectionQuery.IsAvailable(lesson))
                throw new ValidationAppException("Publish the lesson first, or unpublish the collection to add drafts.");
            collection.Lessons.Add(new() { CollectionId = collection.Id, LessonId = lesson.Id, Lesson = lesson,
                Position = collection.Lessons.Select(x => x.Position).DefaultIfEmpty(0).Max() + 1 });
            collection.Version++;
        }
        await db.PredefinedMemoryLessons.AddAsync(lesson, cancellationToken);
        await ContentLibraryPersistence.SaveChangesAsync(db, cancellationToken);
        return ApiResponse<PredefinedMemoryLessonDto>.Ok(PredefinedMemoryLessonMapper.ToDto(lesson));
    }
}

public sealed class UpdatePredefinedMemoryLessonCommandHandler(IAppDbContext db)
    : IRequestHandler<UpdatePredefinedMemoryLessonCommand, ApiResponse<PredefinedMemoryLessonDto>>
{
    public async Task<ApiResponse<PredefinedMemoryLessonDto>> Handle(
        UpdatePredefinedMemoryLessonCommand request,
        CancellationToken cancellationToken)
    {
        var lesson = await db.PredefinedMemoryLessons.Include(x => x.Items).Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.Id == request.LessonId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("Predefined lesson not found.");
        if (request.Request.ExpectedVersion is null)
            throw new ValidationAppException("ExpectedVersion is required when updating a lesson.");
        if (request.Request.ExpectedVersion != lesson.Version)
            throw new ConflictAppException($"This lesson changed. Reload version {lesson.Version} before saving.");

        PredefinedMemoryLessonAggregate.Validate(request.Request);
        var category = await db.PredefinedMemoryLessonCategories.FirstOrDefaultAsync(
            x => x.Id == request.Request.CategoryId && !x.IsDeleted,
            cancellationToken) ?? throw new ValidationAppException("The selected lesson category does not exist.");
        await PredefinedMemoryLessonValidation.ValidatePalaceSceneAsync(db, request.Request, cancellationToken);
        if (request.Request.IsPublished && !category.IsActive)
            throw new ValidationAppException("Activate the selected category before publishing this lesson.");
        var key = request.Request.Key.Trim();
        if (await db.PredefinedMemoryLessons.AnyAsync(
            x => x.Id != lesson.Id && x.Key == key && !x.IsDeleted,
            cancellationToken))
            throw new ConflictAppException("A lesson with this key already exists.");

        PredefinedMemoryLessonAggregate.Update(lesson, request.Request);
        lesson.Category = category;
        await ContentLibraryPersistence.SaveChangesAsync(db, cancellationToken);
        return ApiResponse<PredefinedMemoryLessonDto>.Ok(PredefinedMemoryLessonMapper.ToDto(lesson));
    }
}

internal static class PredefinedMemoryLessonValidation
{
    public static async Task ValidatePalaceSceneAsync(
        IAppDbContext db,
        PredefinedMemoryLessonUpsertRequest request,
        CancellationToken cancellationToken)
    {
        if (request.TechniqueKey != MemoryTechniqueKeys.Palace)
            return;

        var exists = await db.PalaceScenes.AnyAsync(
            x => x.Id == request.PalaceSceneId &&
                !x.IsDeleted &&
                x.Status == PalaceSceneStatuses.Published,
            cancellationToken);
        if (!exists)
            throw new ValidationAppException("Choose a published Palace scene for this lesson.");
    }
}

public sealed class DeletePredefinedMemoryLessonCommandHandler(IAppDbContext db)
    : IRequestHandler<DeletePredefinedMemoryLessonCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(
        DeletePredefinedMemoryLessonCommand request,
        CancellationToken cancellationToken)
    {
        var lesson = await db.PredefinedMemoryLessons.Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == request.LessonId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("Predefined lesson not found.");
        var collections = await db.PredefinedMemoryCollections.WithLessons()
            .Where(x => !x.IsDeleted && x.Lessons.Any(m => m.LessonId == lesson.Id)).ToListAsync(cancellationToken);
        foreach (var collection in collections)
        {
            collection.Lessons.Remove(collection.Lessons.Single(x => x.LessonId == lesson.Id));
            if (!collection.Lessons.Any(x => !x.Lesson.IsDeleted)) collection.IsPublished = false;
            collection.Version++;
        }
        foreach (var item in lesson.Items.Where(x => !x.IsDeleted)) db.PredefinedMemoryLessonItems.Remove(item);
        lesson.Version++;
        db.PredefinedMemoryLessons.Remove(lesson);
        await ContentLibraryPersistence.SaveChangesAsync(db, cancellationToken);
        return ApiResponse<bool>.Ok(true);
    }
}
