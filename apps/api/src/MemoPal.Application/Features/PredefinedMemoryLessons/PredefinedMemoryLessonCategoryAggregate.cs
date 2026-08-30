using System.Text.RegularExpressions;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Features.PredefinedMemoryLessons.DTOs;
using MemoPal.Domain.Entities;

namespace MemoPal.Application.Features.PredefinedMemoryLessons;

internal static partial class PredefinedMemoryLessonCategoryAggregate
{
    public static PredefinedMemoryLessonCategory Create(PredefinedMemoryLessonCategoryUpsertRequest request)
    {
        Validate(request);
        var category = new PredefinedMemoryLessonCategory { Version = 1 };
        Apply(category, request);
        return category;
    }

    public static void Update(
        PredefinedMemoryLessonCategory category,
        PredefinedMemoryLessonCategoryUpsertRequest request)
    {
        Validate(request);
        Apply(category, request);
        category.Version += 1;
    }

    public static void Validate(PredefinedMemoryLessonCategoryUpsertRequest request)
    {
        var key = request.Key.Trim();
        if (key.Length is < 2 or > 100 || !KeyPattern().IsMatch(key))
            throw new ValidationAppException("Category key must use 2-100 lowercase letters, numbers, or hyphens.");
        ValidateRequired(request.NameEn, 120, "English category name");
        ValidateRequired(request.NameZh, 120, "Chinese category name");
        if (request.DescriptionEn.Trim().Length > 500 || request.DescriptionZh.Trim().Length > 500)
            throw new ValidationAppException("Category descriptions must be at most 500 characters.");
        if (string.IsNullOrWhiteSpace(request.Emoji) || request.Emoji.Trim().Length > 32)
            throw new ValidationAppException("Choose a short category emoji.");
        if (request.SortOrder is < 0 or > 10000)
            throw new ValidationAppException("Sort order must be between 0 and 10000.");
    }

    private static void Apply(
        PredefinedMemoryLessonCategory category,
        PredefinedMemoryLessonCategoryUpsertRequest request)
    {
        category.Key = request.Key.Trim();
        category.NameEn = request.NameEn.Trim();
        category.NameZh = request.NameZh.Trim();
        category.DescriptionEn = request.DescriptionEn.Trim();
        category.DescriptionZh = request.DescriptionZh.Trim();
        category.Emoji = request.Emoji.Trim();
        category.SortOrder = request.SortOrder;
        category.IsActive = request.IsActive;
    }

    private static void ValidateRequired(string value, int maxLength, string label)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Trim().Length > maxLength)
            throw new ValidationAppException($"{label} is required and must be at most {maxLength} characters.");
    }

    [GeneratedRegex("^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    private static partial Regex KeyPattern();
}
