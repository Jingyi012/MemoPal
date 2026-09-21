using System.Text.RegularExpressions;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Features.PredefinedMemoryLessons.DTOs;
using MemoPal.Domain.Entities;

namespace MemoPal.Application.Features.PredefinedMemoryLessons;

internal static partial class PredefinedMemoryLessonAggregate
{
    public static PredefinedMemoryLesson Create(PredefinedMemoryLessonUpsertRequest request)
    {
        Validate(request);
        var lesson = new PredefinedMemoryLesson { Version = 1 };
        Apply(lesson, request);
        foreach (var item in request.Items) lesson.Items.Add(CreateItem(lesson.Id, item));
        return lesson;
    }

    public static void Update(PredefinedMemoryLesson lesson, PredefinedMemoryLessonUpsertRequest request)
    {
        Validate(request);
        Apply(lesson, request);

        var requestedIds = request.Items
            .Where(x => !string.IsNullOrWhiteSpace(x.Id))
            .Select(x => x.Id!)
            .ToHashSet(StringComparer.Ordinal);
        foreach (var item in lesson.Items.Where(x => !x.IsDeleted && !requestedIds.Contains(x.Id)))
        {
            item.IsDeleted = true;
            item.DeletedAt = DateTime.UtcNow;
        }

        var existing = lesson.Items.Where(x => !x.IsDeleted).ToDictionary(x => x.Id);
        foreach (var input in request.Items)
        {
            if (string.IsNullOrWhiteSpace(input.Id))
            {
                lesson.Items.Add(CreateItem(lesson.Id, input));
                continue;
            }

            if (!existing.TryGetValue(input.Id, out var item))
                throw new ValidationAppException("A submitted lesson item does not belong to this lesson.");
            ApplyItem(item, input);
        }

        lesson.Version += 1;
    }

    public static void Validate(PredefinedMemoryLessonUpsertRequest request)
    {
        var key = request.Key.Trim();
        if (key.Length is < 2 or > 100 || !KeyPattern().IsMatch(key))
            throw new ValidationAppException("Lesson key must use 2-100 lowercase letters, numbers, or hyphens.");
        ValidateRequired(request.TitleEn, 200, "English title");
        ValidateRequired(request.TitleZh, 200, "Chinese title");
        ValidateOptional(request.DescriptionEn, 500, "English description");
        ValidateOptional(request.DescriptionZh, 500, "Chinese description");
        if (string.IsNullOrWhiteSpace(request.Emoji) || request.Emoji.Trim().Length > 32)
            throw new ValidationAppException("Choose a short lesson emoji.");
        if (string.IsNullOrWhiteSpace(request.CategoryId))
            throw new ValidationAppException("Choose a lesson category.");
        if (!MemoryTechniqueKeys.All.Contains(request.TechniqueKey))
            throw new ValidationAppException("Lesson technique is invalid.");
        if (!MemoryGoalTypes.All.Contains(request.GoalType))
            throw new ValidationAppException("Lesson goal type is invalid.");
        if (request.TechniqueKey == MemoryTechniqueKeys.Palace && string.IsNullOrWhiteSpace(request.PalaceSceneId))
            throw new ValidationAppException("A Memory Palace lesson needs a Palace scene.");
        if (request.TechniqueKey == MemoryTechniqueKeys.NumberPeg && !string.IsNullOrWhiteSpace(request.PalaceSceneId))
            throw new ValidationAppException("Number Peg lessons cannot use a Palace scene.");
        if (request.SortOrder is < 0 or > 10000)
            throw new ValidationAppException("Sort order must be between 0 and 10000.");
        if (request.Items.Count is < 1 or > 100)
            throw new ValidationAppException("A lesson needs between 1 and 100 items.");

        var positions = new HashSet<int>();
        foreach (var item in request.Items)
        {
            if (item.Position < 1 || !positions.Add(item.Position))
                throw new ValidationAppException("Lesson item positions must be unique positive numbers.");
            ValidateRequired(item.ContentEn, 500, $"English content for item {item.Position}");
            ValidateRequired(item.ContentZh, 500, $"Chinese content for item {item.Position}");
            if (request.IsPublished)
            {
                ValidateRequired(item.AssociationEn, 1000, $"English association for item {item.Position}");
                ValidateRequired(item.AssociationZh, 1000, $"Chinese association for item {item.Position}");
            }
        }

        if (request.TechniqueKey == MemoryTechniqueKeys.NumberPeg && request.Items.Count > 100)
            throw new ValidationAppException("Number Peg lessons support at most 100 items.");
        if (request.IsStarterLesson && request.TechniqueKey != MemoryTechniqueKeys.NumberPeg)
            throw new ValidationAppException("The current guided onboarding supports Number Peg starter lessons only.");
        if (request.IsStarterLesson && request.Items.Count is < 2 or > 5)
            throw new ValidationAppException("A starter lesson needs between 2 and 5 items.");
    }

    private static void Apply(PredefinedMemoryLesson lesson, PredefinedMemoryLessonUpsertRequest request)
    {
        lesson.Key = request.Key.Trim();
        lesson.TitleEn = request.TitleEn.Trim();
        lesson.TitleZh = request.TitleZh.Trim();
        lesson.DescriptionEn = request.DescriptionEn.Trim();
        lesson.DescriptionZh = request.DescriptionZh.Trim();
        lesson.Emoji = request.Emoji.Trim();
        lesson.CategoryId = request.CategoryId.Trim();
        lesson.TechniqueKey = request.TechniqueKey;
        lesson.GoalType = request.GoalType;
        lesson.PalaceSceneId = request.TechniqueKey == MemoryTechniqueKeys.Palace
            ? request.PalaceSceneId?.Trim()
            : null;
        lesson.SortOrder = request.SortOrder;
        lesson.IsPublished = request.IsPublished;
        lesson.IsStarterLesson = request.IsStarterLesson;
    }

    private static PredefinedMemoryLessonItem CreateItem(string lessonId, PredefinedMemoryLessonItemInput input)
    {
        var item = new PredefinedMemoryLessonItem { LessonId = lessonId };
        ApplyItem(item, input);
        return item;
    }

    private static void ApplyItem(PredefinedMemoryLessonItem item, PredefinedMemoryLessonItemInput input)
    {
        item.Position = input.Position;
        item.ContentEn = input.ContentEn.Trim();
        item.ContentZh = input.ContentZh.Trim();
        item.AssociationEn = input.AssociationEn.Trim();
        item.AssociationZh = input.AssociationZh.Trim();
    }

    private static void ValidateRequired(string value, int maxLength, string label)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Trim().Length > maxLength)
            throw new ValidationAppException($"{label} is required and must be at most {maxLength} characters.");
    }

    private static void ValidateOptional(string value, int maxLength, string label)
    {
        if (value.Trim().Length > maxLength)
            throw new ValidationAppException($"{label} must be at most {maxLength} characters.");
    }

    [GeneratedRegex("^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    private static partial Regex KeyPattern();
}
