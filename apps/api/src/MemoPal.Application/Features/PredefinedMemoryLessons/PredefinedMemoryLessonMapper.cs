using MemoPal.Application.Features.PredefinedMemoryLessons.DTOs;
using MemoPal.Domain.Entities;

namespace MemoPal.Application.Features.PredefinedMemoryLessons;

internal static class PredefinedMemoryLessonMapper
{
    public static PredefinedMemoryLessonDto ToDto(PredefinedMemoryLesson lesson) => new(
        lesson.Id,
        lesson.Key,
        lesson.TitleEn,
        lesson.TitleZh,
        lesson.DescriptionEn,
        lesson.DescriptionZh,
        lesson.Emoji,
        lesson.CategoryId,
        ToCategoryDto(lesson.Category),
        lesson.TechniqueKey,
        lesson.GoalType,
        lesson.SortOrder,
        lesson.IsPublished,
        lesson.Version,
        lesson.Items.Where(x => !x.IsDeleted).OrderBy(x => x.Position).Select(x => new PredefinedMemoryLessonItemDto(
            x.Id, x.Position, x.ContentEn, x.ContentZh, x.CreatedAt, x.CreatedBy, x.UpdatedAt, x.UpdatedBy)).ToList(),
        lesson.CreatedAt,
        lesson.CreatedBy,
        lesson.UpdatedAt,
        lesson.UpdatedBy);

    public static PredefinedMemoryLessonCategoryDto ToCategoryDto(PredefinedMemoryLessonCategory category) => new(
        category.Id,
        category.Key,
        category.NameEn,
        category.NameZh,
        category.DescriptionEn,
        category.DescriptionZh,
        category.Emoji,
        category.SortOrder,
        category.IsActive,
        category.Version,
        category.CreatedAt,
        category.CreatedBy,
        category.UpdatedAt,
        category.UpdatedBy);
}
