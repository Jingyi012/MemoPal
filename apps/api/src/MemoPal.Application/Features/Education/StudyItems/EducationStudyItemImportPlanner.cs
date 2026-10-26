using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;

namespace MemoPal.Application.Features.Education.StudyItems;

internal enum EducationStudyItemImportChangeKind { Create, Update, Unchanged }
internal sealed record EducationStudyItemImportPlanEntry(EducationObjectiveStudyItemRequest Request, string Key, int Row,
    EducationObjectiveStudyItem? Existing, EducationStudyItemImportChangeKind ChangeKind);
internal sealed record EducationStudyItemImportPlan(IReadOnlyList<EducationStudyItemImportPlanEntry> Entries,
    EducationStudyItemImportResult Result);

internal static class EducationStudyItemImportPlanner
{
    public const int MaxRows = 1000;
    public const int MaxFileBytes = EducationStudyItemImportResult.MaxImportBytes;

    public static EducationStudyItemImportPlan Create(string objectiveId,
        IReadOnlyList<EducationObjectiveStudyItemRequest> requests, IReadOnlyList<int>? sourceRows,
        IReadOnlyList<EducationObjectiveStudyItem> existingItems, EducationMemoryContentType objectiveKind)
    {
        var errors = new List<EducationStudyItemImportError>();
        var entries = new List<EducationStudyItemImportPlanEntry>();
        if (requests.Count == 0)
            errors.Add(new(1, "items", "ItemsRequired", "At least one study item is required."));
        if (requests.Count > MaxRows)
            errors.Add(new(1, "items", "TooManyRows", "An import can contain at most 1000 rows."));

        for (var index = 0; index < requests.Count && index < MaxRows; index++)
        {
            var sourceRow = sourceRows?.ElementAtOrDefault(index) ?? 0;
            var row = sourceRow > 0 ? sourceRow : index + 2;
            try
            {
                var normalized = EducationStudyItemValidation.Normalize(requests[index]);
                var key = EducationStudyItemValidation.StableKey(normalized);
                var match = existingItems.FirstOrDefault(x => x.StableKey == key);
                var change = match is null ? EducationStudyItemImportChangeKind.Create :
                    IsSame(match, normalized) ? EducationStudyItemImportChangeKind.Unchanged : EducationStudyItemImportChangeKind.Update;
                entries.Add(new(normalized, key, row, match, change));
            }
            catch (ValidationAppException ex)
            {
                var field = ex.Message.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? "row";
                errors.Add(new(row, field, EducationStudyItemImportErrorCodes.For(field, ex.Message), SafeMessage(field, ex.Message)));
            }
        }

        foreach (var group in entries.GroupBy(x => x.Key, StringComparer.Ordinal).Where(x => x.Count() > 1))
            foreach (var entry in group) errors.Add(new(entry.Row, "key", "DuplicateStableKey", "Duplicate stable key in this import."));

        foreach (var entry in entries.Where(x => x.Existing?.Status == EducationStudyItemStatus.Published &&
                     x.ChangeKind != EducationStudyItemImportChangeKind.Unchanged))
            errors.Add(new(entry.Row, "key", "PublishedItemConflict", "Published study items must be withdrawn before they can be changed."));

        var finalItems = existingItems.Where(x => entries.All(entry => entry.Existing?.Id != x.Id))
            .Select(x => x).ToList();
        finalItems.AddRange(entries.Where(x => errors.All(e => e.Row != x.Row))
            .Select(x => x.Existing is null
                ? ImportObjectiveStudyItemsHandler.ToEntity(objectiveId, x.Key, x.Request)
                : ImportObjectiveStudyItemsHandler.ToEntity(objectiveId, x.Key, x.Request)));
        if (finalItems.Count > 100)
            errors.Add(new(1, "items", "ItemsLimitExceeded", "A knowledge point can contain at most 100 study items."));
        try { ImportObjectiveStudyItemsHandler.EnsureValidPositions(finalItems, objectiveKind); }
        catch (ValidationAppException ex)
        {
            errors.Add(new(1, "position", EducationStudyItemImportErrorCodes.For("position", ex.Message), SafeMessage("position", ex.Message)));
        }

        var created = entries.Count(x => x.ChangeKind == EducationStudyItemImportChangeKind.Create);
        var updated = entries.Count(x => x.ChangeKind == EducationStudyItemImportChangeKind.Update);
        var unchanged = entries.Count(x => x.ChangeKind == EducationStudyItemImportChangeKind.Unchanged);
        var rejectedRows = errors.Select(x => x.Row).Distinct().Count();
        var canImport = errors.Count == 0;
        return new(entries, new(false, canImport ? created : 0, canImport ? updated : 0, errors,
            canImport ? unchanged : 0, rejectedRows, canImport));
    }

    private static bool IsSame(EducationObjectiveStudyItem item, EducationObjectiveStudyItemRequest request) =>
        item.Position == request.Position && item.Kind.ToString() == request.Kind && item.Primary == request.Primary &&
        item.Secondary == request.Secondary && item.Phonetic == request.Phonetic && item.Extra == request.Extra &&
        item.Hint == request.Hint && item.MediaRef == request.MediaRef && item.LanguageCode == request.LanguageCode;

    private static string SafeMessage(string field, string message)
    {
        // Validation messages contain field/rule details only; do not echo submitted content.
        if (message.Contains("exceeds", StringComparison.OrdinalIgnoreCase)) return $"{field} exceeds its allowed length.";
        return message.Length > 180 ? $"{field} is invalid." : message;
    }
}
