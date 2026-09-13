using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.PredefinedMemoryLessons.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.PredefinedMemoryLessons.Commands;

public sealed record SaveMemoryCollectionCommand(string? CollectionId, PredefinedMemoryCollectionRequest Request)
    : IRequest<ApiResponse<PredefinedMemoryCollectionDto>>;

public sealed class SaveMemoryCollectionCommandHandler(IAppDbContext db)
    : IRequestHandler<SaveMemoryCollectionCommand, ApiResponse<PredefinedMemoryCollectionDto>>
{
    public async Task<ApiResponse<PredefinedMemoryCollectionDto>> Handle(SaveMemoryCollectionCommand command, CancellationToken ct)
    {
        var input = command.Request;
        if (string.IsNullOrWhiteSpace(input.TitleEn) || input.TitleEn.Trim().Length > 200 ||
            string.IsNullOrWhiteSpace(input.TitleZh) || input.TitleZh.Trim().Length > 200 ||
            input.DescriptionEn.Length > 500 || input.DescriptionZh.Length > 500 ||
            string.IsNullOrWhiteSpace(input.Emoji) || input.Emoji.Length > 32 || input.SortOrder is < 0 or > 10000)
            throw new ValidationAppException("Provide collection titles, a short emoji, and valid descriptions and sort order.");
        if (input.LessonIds.Count > 100 || input.LessonIds.Distinct().Count() != input.LessonIds.Count ||
            (input.IsPublished && input.LessonIds.Count == 0))
            throw new ValidationAppException("Choose up to 100 distinct lessons. Published collections require at least one lesson.");
        var category = await db.PredefinedMemoryLessonCategories.FirstOrDefaultAsync(x => x.Id == input.CategoryId && !x.IsDeleted, ct)
            ?? throw new ValidationAppException("Choose an existing category.");
        var lessons = await db.PredefinedMemoryLessons.Include(x => x.Category).Include(x => x.Items)
            .Where(x => input.LessonIds.Contains(x.Id) && !x.IsDeleted).ToListAsync(ct);
        if (lessons.Count != input.LessonIds.Count)
            throw new ValidationAppException("One or more lessons no longer exist.");
        if (input.IsPublished && (!category.IsActive || lessons.Any(x => !PredefinedMemoryCollectionQuery.IsAvailable(x))))
            throw new ValidationAppException("Publish all selected lessons and activate their categories before publishing the collection.");

        var entity = command.CollectionId is null ? new PredefinedMemoryCollection() :
            await db.PredefinedMemoryCollections.WithLessons().FirstOrDefaultAsync(x => x.Id == command.CollectionId && !x.IsDeleted, ct)
                ?? throw new NotFoundAppException("Collection not found.");
        if (command.CollectionId is not null && input.ExpectedVersion != entity.Version)
            throw new ConflictAppException("This collection changed. Reload before saving.");
        entity.TitleEn = input.TitleEn.Trim();
        entity.TitleZh = input.TitleZh.Trim();
        entity.DescriptionEn = input.DescriptionEn.Trim();
        entity.DescriptionZh = input.DescriptionZh.Trim();
        entity.Emoji = input.Emoji.Trim();
        entity.CategoryId = category.Id;
        entity.Category = category;
        entity.IsPublished = input.IsPublished;
        entity.SortOrder = input.SortOrder;
        if (command.CollectionId is not null) entity.Version++;
        foreach (var removed in entity.Lessons.Where(x => !input.LessonIds.Contains(x.LessonId)).ToList())
            entity.Lessons.Remove(removed);
        for (var i = 0; i < input.LessonIds.Count; i++)
        {
            var id = input.LessonIds[i];
            var membership = entity.Lessons.FirstOrDefault(x => x.LessonId == id);
            if (membership is null)
            {
                membership = new PredefinedMemoryCollectionLesson { CollectionId = entity.Id, LessonId = id, Lesson = lessons.Single(x => x.Id == id) };
                entity.Lessons.Add(membership);
            }
            membership.Position = i + 1;
        }
        if (command.CollectionId is null) db.PredefinedMemoryCollections.Add(entity);
        await db.SaveChangesAsync(ct);
        return ApiResponse<PredefinedMemoryCollectionDto>.Ok(PredefinedMemoryCollectionQuery.ToDto(entity, false));
    }
}
