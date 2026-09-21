using MemoPal.Domain.Entities;
using MemoPal.Application.Features.PredefinedMemoryLessons.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.PredefinedMemoryLessons;

internal static class PredefinedMemoryCollectionQuery
{
    public static IQueryable<PredefinedMemoryCollection> WithLessons(this IQueryable<PredefinedMemoryCollection> query) => query
        .Include(x => x.Category)
        .Include(x => x.Lessons).ThenInclude(x => x.Lesson).ThenInclude(x => x.Category)
        .Include(x => x.Lessons).ThenInclude(x => x.Lesson).ThenInclude(x => x.Items);

    public static bool IsAvailable(PredefinedMemoryLesson lesson) => !lesson.IsDeleted && lesson.IsPublished
        && !lesson.Category.IsDeleted && lesson.Category.IsActive
        && (lesson.TechniqueKey != MemoryTechniqueKeys.Palace || !string.IsNullOrWhiteSpace(lesson.PalaceSceneId))
        && lesson.Items.Where(x => !x.IsDeleted).All(x =>
            !string.IsNullOrWhiteSpace(x.AssociationEn) && !string.IsNullOrWhiteSpace(x.AssociationZh));

    public static PredefinedMemoryCollectionDto ToDto(PredefinedMemoryCollection entity, bool publishedOnly) => new(
        entity.Id, entity.TitleEn, entity.TitleZh, entity.DescriptionEn, entity.DescriptionZh,
        entity.Emoji, entity.CategoryId, entity.IsPublished, entity.SortOrder, entity.Version,
        entity.Lessons.OrderBy(x => x.Position).ThenBy(x => x.LessonId)
            .Where(x => !x.Lesson.IsDeleted && (!publishedOnly || IsAvailable(x.Lesson)))
            .Select(x => PredefinedMemoryLessonMapper.ToDto(x.Lesson)).ToList());
}
