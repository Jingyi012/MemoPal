using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Authoring;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace MemoPal.Application.Features.Education.StudyItems;

public sealed record UpdateObjectiveStudyMetadataCommand(string UserId, string CourseId, string ObjectiveId,
    UpdateEducationObjectiveStudyMetadataRequest Request, bool IsAdmin = false) : IRequest<ApiResponse<EducationObjectiveDto>>;

public sealed class UpdateObjectiveStudyMetadataHandler(IAppDbContext db)
    : IRequestHandler<UpdateObjectiveStudyMetadataCommand, ApiResponse<EducationObjectiveDto>>
{
    public async Task<ApiResponse<EducationObjectiveDto>> Handle(UpdateObjectiveStudyMetadataCommand q, CancellationToken ct)
    {
        await AuthoringValidation.OwnedCourse(db, q.UserId, q.CourseId, ct, q.IsAdmin);
        var objective = await OwnedObjective(db, q.UserId, q.CourseId, q.ObjectiveId, ct, q.IsAdmin);
        objective.MemoryContentType = EducationStudyItemValidation.ParseEnum<EducationMemoryContentType>(q.Request.MemoryContentType, "MemoryContentType");
        objective.LanguageCode = EducationStudyItemValidation.Language(q.Request.LanguageCode);
        objective.GradeCode = EducationStudyItemValidation.GradeCode(q.Request.GradeCode);
        objective.CurriculumCode = EducationStudyItemValidation.ShortCode(q.Request.CurriculumCode, "CurriculumCode");
        objective.SubjectCode = EducationStudyItemValidation.ShortCode(q.Request.SubjectCode, "SubjectCode");
        objective.ContentOrigin = EducationStudyItemValidation.ParseEnum<EducationContentOrigin>(q.Request.ContentOrigin, "ContentOrigin");
        objective.ReviewStatus = EducationStudyItemValidation.ParseEnum<EducationContentReviewStatus>(q.Request.ReviewStatus, "ReviewStatus");
        await db.SaveChangesAsync(ct);
        return ApiResponse<EducationObjectiveDto>.Ok(ToObjectiveDto(objective));
    }

    internal static async Task<EducationObjective> OwnedObjective(IAppDbContext db, string userId, string courseId,
        string objectiveId, CancellationToken ct, bool isAdmin = false) =>
        await db.EducationObjectives.FirstOrDefaultAsync(x => x.Id == objectiveId && x.CourseId == courseId &&
            !x.IsDeleted && x.Course != null && (x.Course.UserId == userId ||
                (isAdmin && x.Course.UserId == AuthoringValidation.SystemOwnerId)) && !x.Course.IsDeleted, ct)
        ?? throw new NotFoundAppException("Learning objective not found.");

    internal static EducationObjectiveDto ToObjectiveDto(EducationObjective x) => new(x.Id, x.CourseId, x.Title,
        x.CreatedAt, x.RecommendedMemorySetId, x.MemoryContentType.ToString(), x.LanguageCode, x.GradeCode,
        x.CurriculumCode, x.SubjectCode, x.ContentOrigin.ToString(), x.ReviewStatus.ToString());
}

public sealed record GetAuthorStudyItemsQuery(string UserId, string CourseId, string ObjectiveId)
    : IRequest<ApiResponse<IReadOnlyList<EducationObjectiveStudyItemAuthorDto>>> { public bool IsAdmin { get; init; } }

public sealed class GetAuthorStudyItemsHandler(IAppDbContext db)
    : IRequestHandler<GetAuthorStudyItemsQuery, ApiResponse<IReadOnlyList<EducationObjectiveStudyItemAuthorDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<EducationObjectiveStudyItemAuthorDto>>> Handle(GetAuthorStudyItemsQuery q, CancellationToken ct)
    {
        await UpdateObjectiveStudyMetadataHandler.OwnedObjective(db, q.UserId, q.CourseId, q.ObjectiveId, ct, q.IsAdmin);
        var rows = await db.EducationObjectiveStudyItems.AsNoTracking().Where(x => x.ObjectiveId == q.ObjectiveId && !x.IsDeleted)
            .OrderBy(x => x.Position).ToListAsync(ct);
        return ApiResponse<IReadOnlyList<EducationObjectiveStudyItemAuthorDto>>.Ok(rows.Select(ToAuthorDto).ToArray());
    }

    internal static EducationObjectiveStudyItemAuthorDto ToAuthorDto(EducationObjectiveStudyItem x) => new(
        x.Id, x.ObjectiveId, x.StableKey, x.Position, x.Kind.ToString(), x.Primary, x.Secondary, x.Phonetic,
        x.Extra, x.Hint, x.MediaRef, x.LanguageCode, x.Status.ToString(), x.ContentVersion,
        x.NotConfidentialExamContentConfirmedByUserId, x.NotConfidentialExamContentConfirmedAtUtc,
        x.CreatedAt, x.UpdatedAt);
}

public sealed record CreateObjectiveStudyItemCommand(string UserId, string CourseId, string ObjectiveId,
    EducationObjectiveStudyItemRequest Request, bool IsAdmin = false) : IRequest<ApiResponse<EducationObjectiveStudyItemAuthorDto>>;

public sealed class CreateObjectiveStudyItemHandler(IAppDbContext db)
    : IRequestHandler<CreateObjectiveStudyItemCommand, ApiResponse<EducationObjectiveStudyItemAuthorDto>>
{
    public async Task<ApiResponse<EducationObjectiveStudyItemAuthorDto>> Handle(CreateObjectiveStudyItemCommand q, CancellationToken ct)
    {
        var result = await new ImportObjectiveStudyItemsHandler(db).Handle(
            new(q.UserId, q.CourseId, q.ObjectiveId, [q.Request], IsAdmin: q.IsAdmin), ct);
        if (!result.Data!.Imported)
            throw new ValidationAppException(string.Join("; ", result.Data.Errors.Select(x => $"{x.Field}: {x.Message}")));
        var key = EducationStudyItemValidation.StableKey(EducationStudyItemValidation.Normalize(q.Request));
        var item = await db.EducationObjectiveStudyItems.AsNoTracking()
            .SingleAsync(x => x.ObjectiveId == q.ObjectiveId && x.StableKey == key && !x.IsDeleted, ct);
        return ApiResponse<EducationObjectiveStudyItemAuthorDto>.Ok(GetAuthorStudyItemsHandler.ToAuthorDto(item));
    }
}

public sealed record ImportObjectiveStudyItemsCsvCommand(string UserId, string CourseId, string ObjectiveId, byte[] Content)
    : IRequest<ApiResponse<EducationStudyItemImportResult>>
{
    public bool DryRun { get; init; }
    public bool IsAdmin { get; init; }
}

public sealed class ImportObjectiveStudyItemsCsvHandler(IAppDbContext db)
    : IRequestHandler<ImportObjectiveStudyItemsCsvCommand, ApiResponse<EducationStudyItemImportResult>>
{
    public async Task<ApiResponse<EducationStudyItemImportResult>> Handle(ImportObjectiveStudyItemsCsvCommand q, CancellationToken ct)
    {
        await UpdateObjectiveStudyMetadataHandler.OwnedObjective(db, q.UserId, q.CourseId, q.ObjectiveId, ct, q.IsAdmin);
        if (q.Content.Length > EducationStudyItemImportPlanner.MaxFileBytes)
            return ApiResponse<EducationStudyItemImportResult>.Ok(EducationStudyItemImportResult.Rejected(
                [new(1, "file", "FileTooLarge", "CSV file exceeds the 1 MB limit.")]));
        var parsed = EducationStudyItemCsvParser.Parse(q.Content);
        if (parsed.Errors.Count > 0)
            return ApiResponse<EducationStudyItemImportResult>.Ok(EducationStudyItemImportResult.Rejected(parsed.Errors));
        return await new ImportObjectiveStudyItemsHandler(db).Handle(
            new(q.UserId, q.CourseId, q.ObjectiveId, parsed.Items, parsed.SourceRows, q.DryRun, IsAdmin: q.IsAdmin), ct);
    }
}
public sealed record ImportObjectiveStudyItemsCommand(string UserId, string CourseId, string ObjectiveId,
    IReadOnlyList<EducationObjectiveStudyItemRequest> Items, IReadOnlyList<int>? SourceRows = null, bool DryRun = false, long? ContentLength = null, bool IsAdmin = false)
    : IRequest<ApiResponse<EducationStudyItemImportResult>>;

public sealed class ImportObjectiveStudyItemsHandler(IAppDbContext db)
    : IRequestHandler<ImportObjectiveStudyItemsCommand, ApiResponse<EducationStudyItemImportResult>>
{
    public Task<ApiResponse<EducationStudyItemImportResult>> Handle(ImportObjectiveStudyItemsCommand q, CancellationToken ct) =>
        db.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
            // Re-read the entire unit of work after a transient failure; no staged
            // positions or entities from a rolled-back attempt may be reused.
            db.ClearTracking();
            return await HandleAttempt(q, ct);
        });

    private async Task<ApiResponse<EducationStudyItemImportResult>> HandleAttempt(ImportObjectiveStudyItemsCommand q, CancellationToken ct)
    {
        await UpdateObjectiveStudyMetadataHandler.OwnedObjective(db, q.UserId, q.CourseId, q.ObjectiveId, ct, q.IsAdmin);
        if (q.ContentLength is > EducationStudyItemImportPlanner.MaxFileBytes ||
            JsonSerializer.SerializeToUtf8Bytes(q.Items).Length > EducationStudyItemImportPlanner.MaxFileBytes)
            return ApiResponse<EducationStudyItemImportResult>.Ok(EducationStudyItemImportResult.Rejected(
                [new(1, "file", "FileTooLarge", "Import payload exceeds the 1 MB limit.")]));
        if (q.Items is null || q.Items.Count == 0) return ApiResponse<EducationStudyItemImportResult>.Ok(
            EducationStudyItemImportResult.Rejected([new(1, "items", "ItemsRequired", "At least one study item is required.")]));
        if (q.Items.Count > EducationStudyItemImportPlanner.MaxRows) return ApiResponse<EducationStudyItemImportResult>.Ok(
            EducationStudyItemImportResult.Rejected([new(1, "items", "TooManyRows", "An import can contain at most 1000 rows.")]));
        var current = await db.EducationObjectiveStudyItems.Where(x => x.ObjectiveId == q.ObjectiveId && !x.IsDeleted)
            .ToListAsync(ct);
        var kind = await GetObjectiveKind(db, q.ObjectiveId, ct);
        var plan = EducationStudyItemImportPlanner.Create(q.ObjectiveId, q.Items, q.SourceRows, current, kind);
        if (!plan.Result.CanImport || q.DryRun) return ApiResponse<EducationStudyItemImportResult>.Ok(plan.Result);
        if (plan.Entries.All(x => x.ChangeKind == EducationStudyItemImportChangeKind.Unchanged))
            return ApiResponse<EducationStudyItemImportResult>.Ok(plan.Result with { Imported = true });
        var preexistingIds = current.Select(x => x.Id).ToHashSet(StringComparer.Ordinal);
        foreach (var entry in plan.Entries)
        {
            if (entry.Existing is null) db.EducationObjectiveStudyItems.Add(ToEntity(q.ObjectiveId, entry.Key, entry.Request));
            else if (entry.ChangeKind == EducationStudyItemImportChangeKind.Update)
                entry.Existing.UpdateContent(entry.Request.Position, EducationStudyItemValidation.ParseEnum<EducationMemoryContentType>(entry.Request.Kind, "Kind"),
                    entry.Request.Primary, entry.Request.Secondary, entry.Request.Phonetic, entry.Request.Extra,
                    entry.Request.Hint, entry.Request.MediaRef, entry.Request.LanguageCode);
        }
        var finalPositions = current.Concat(plan.Entries.Where(x => x.Existing is null)
                .Select(entry => ToEntity(q.ObjectiveId, entry.Key, entry.Request)))
            .ToDictionary(x => x.StableKey, x => x.Position, StringComparer.Ordinal);
        await using var transaction = await db.BeginTransactionIfSupportedAsync(ct);
        foreach (var item in current.Where(x => preexistingIds.Contains(x.Id))) item.Position += 1000;
        await db.SaveChangesAsync(ct);
        foreach (var item in current)
        {
            item.Position = finalPositions[item.StableKey];
            if (preexistingIds.Contains(item.Id)) item.UpdatedAt = DateTime.UtcNow;
        }
        await db.SaveChangesAsync(ct);
        if (transaction is not null) await transaction.CommitAsync(ct);
        return ApiResponse<EducationStudyItemImportResult>.Ok(plan.Result with { Imported = true });
    }

    internal static EducationObjectiveStudyItem ToEntity(string objectiveId, string stableKey, EducationObjectiveStudyItemRequest request) => new()
    {
        ObjectiveId = objectiveId,
        StableKey = stableKey,
        Position = request.Position,
        Kind = EducationStudyItemValidation.ParseEnum<EducationMemoryContentType>(request.Kind, "Kind"),
        Primary = request.Primary,
        Secondary = request.Secondary,
        Phonetic = request.Phonetic,
        Extra = request.Extra,
        Hint = request.Hint,
        MediaRef = request.MediaRef,
        LanguageCode = request.LanguageCode
    };

    public static void EnsureValidPositions(IReadOnlyCollection<EducationObjectiveStudyItem> items, EducationMemoryContentType type)
    {
        if (items.Count > 100) throw new ValidationAppException("A knowledge point can contain at most 100 study items.");
        if (items.Select(x => x.Position).Distinct().Count() != items.Count)
            throw new ValidationAppException("Study item positions must be unique.");
        if (type == EducationMemoryContentType.OrderedList && items.OrderBy(x => x.Position).Select(x => x.Position)
                .Where((position, index) => position != index + 1).Any())
            throw new ValidationAppException("OrderedList positions must be continuous starting at 1.");
    }

    internal static async Task<EducationMemoryContentType> GetObjectiveKind(IAppDbContext db, string objectiveId, CancellationToken ct) =>
        await db.EducationObjectives.Where(x => x.Id == objectiveId && !x.IsDeleted).Select(x => x.MemoryContentType).FirstAsync(ct);
}

public sealed record UpdateObjectiveStudyItemCommand(string UserId, string CourseId, string ObjectiveId, string ItemId,
    EducationObjectiveStudyItemRequest Request, bool IsAdmin = false) : IRequest<ApiResponse<EducationObjectiveStudyItemAuthorDto>>;

public sealed class UpdateObjectiveStudyItemHandler(IAppDbContext db)
    : IRequestHandler<UpdateObjectiveStudyItemCommand, ApiResponse<EducationObjectiveStudyItemAuthorDto>>
{
    public async Task<ApiResponse<EducationObjectiveStudyItemAuthorDto>> Handle(UpdateObjectiveStudyItemCommand q, CancellationToken ct)
    {
        await UpdateObjectiveStudyMetadataHandler.OwnedObjective(db, q.UserId, q.CourseId, q.ObjectiveId, ct, q.IsAdmin);
        var item = await db.EducationObjectiveStudyItems.FirstOrDefaultAsync(x => x.Id == q.ItemId && x.ObjectiveId == q.ObjectiveId && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("Study item not found.");
        if (item.Status == EducationStudyItemStatus.Published) throw new ValidationAppException("Withdraw a published item before editing it.");
        var request = EducationStudyItemValidation.Normalize(q.Request);
        var requestedKey = EducationStudyItemValidation.StableKey(request);
        if (requestedKey != item.StableKey && await db.EducationObjectiveStudyItems.AnyAsync(x => x.ObjectiveId == q.ObjectiveId && x.StableKey == requestedKey && !x.IsDeleted, ct))
            throw new ValidationAppException("Study item stable key already exists.");
        item.StableKey = requestedKey;
        item.UpdateContent(request.Position, EducationStudyItemValidation.ParseEnum<EducationMemoryContentType>(request.Kind, "Kind"),
            request.Primary, request.Secondary, request.Phonetic, request.Extra, request.Hint, request.MediaRef, request.LanguageCode);
        var all = await db.EducationObjectiveStudyItems.Where(x => x.ObjectiveId == q.ObjectiveId && !x.IsDeleted).ToListAsync(ct);
        ImportObjectiveStudyItemsHandler.EnsureValidPositions(all, await ImportObjectiveStudyItemsHandler.GetObjectiveKind(db, q.ObjectiveId, ct));
        await db.SaveChangesAsync(ct);
        return ApiResponse<EducationObjectiveStudyItemAuthorDto>.Ok(GetAuthorStudyItemsHandler.ToAuthorDto(item));
    }
}

public sealed record DeleteObjectiveStudyItemCommand(string UserId, string CourseId, string ObjectiveId, string ItemId, bool IsAdmin = false)
    : IRequest<ApiResponse<bool>>;
public sealed class DeleteObjectiveStudyItemHandler(IAppDbContext db)
    : IRequestHandler<DeleteObjectiveStudyItemCommand, ApiResponse<bool>>
{
    public Task<ApiResponse<bool>> Handle(DeleteObjectiveStudyItemCommand q, CancellationToken ct) =>
        db.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
            // Re-read the entire unit of work after a transient failure; no staged
            // positions or entities from a rolled-back attempt may be reused.
            db.ClearTracking();
            return await HandleAttempt(q, ct);
        });

    private async Task<ApiResponse<bool>> HandleAttempt(DeleteObjectiveStudyItemCommand q, CancellationToken ct)
    {
        await UpdateObjectiveStudyMetadataHandler.OwnedObjective(db, q.UserId, q.CourseId, q.ObjectiveId, ct, q.IsAdmin);
        var item = await db.EducationObjectiveStudyItems.FirstOrDefaultAsync(x => x.Id == q.ItemId && x.ObjectiveId == q.ObjectiveId && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("Study item not found.");
        var remaining = await db.EducationObjectiveStudyItems.Where(x => x.ObjectiveId == q.ObjectiveId && !x.IsDeleted && x.Id != q.ItemId)
            .OrderBy(x => x.Position).ToListAsync(ct);
        await using var transaction = await db.BeginTransactionIfSupportedAsync(ct);
        item.IsDeleted = true;
        item.DeletedAt = DateTime.UtcNow;
        item.DeletedBy = q.UserId;
        await db.SaveChangesAsync(ct);
        foreach (var row in remaining) row.Position += 1000;
        await db.SaveChangesAsync(ct);
        for (var index = 0; index < remaining.Count; index++)
        {
            remaining[index].Position = index + 1;
            remaining[index].ContentVersion++;
            remaining[index].UpdatedAt = DateTime.UtcNow;
        }
        await db.SaveChangesAsync(ct);
        if (transaction is not null) await transaction.CommitAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}

public sealed record ReorderObjectiveStudyItemsCommand(string UserId, string CourseId, string ObjectiveId, IReadOnlyList<string> ItemIds, bool IsAdmin = false)
    : IRequest<ApiResponse<IReadOnlyList<EducationObjectiveStudyItemAuthorDto>>>;
public sealed class ReorderObjectiveStudyItemsHandler(IAppDbContext db)
    : IRequestHandler<ReorderObjectiveStudyItemsCommand, ApiResponse<IReadOnlyList<EducationObjectiveStudyItemAuthorDto>>>
{
    public Task<ApiResponse<IReadOnlyList<EducationObjectiveStudyItemAuthorDto>>> Handle(ReorderObjectiveStudyItemsCommand q, CancellationToken ct) =>
        db.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
            // Re-read the entire unit of work after a transient failure; no staged
            // positions or entities from a rolled-back attempt may be reused.
            db.ClearTracking();
            return await HandleAttempt(q, ct);
        });

    private async Task<ApiResponse<IReadOnlyList<EducationObjectiveStudyItemAuthorDto>>> HandleAttempt(ReorderObjectiveStudyItemsCommand q, CancellationToken ct)
    {
        await UpdateObjectiveStudyMetadataHandler.OwnedObjective(db, q.UserId, q.CourseId, q.ObjectiveId, ct, q.IsAdmin);
        var rows = await db.EducationObjectiveStudyItems.Where(x => x.ObjectiveId == q.ObjectiveId && !x.IsDeleted).ToListAsync(ct);
        if (q.ItemIds is null || q.ItemIds.Count != rows.Count || q.ItemIds.Distinct().Count() != rows.Count || q.ItemIds.Any(id => rows.All(x => x.Id != id)))
            throw new ValidationAppException("Reorder must contain every active study item exactly once.");
        await using var transaction = await db.BeginTransactionIfSupportedAsync(ct);
        foreach (var item in rows) item.Position += 1000;
        await db.SaveChangesAsync(ct);
        for (var index = 0; index < q.ItemIds.Count; index++)
        {
            var item = rows.Single(x => x.Id == q.ItemIds[index]);
            item.Position = index + 1;
            item.ContentVersion++;
            item.UpdatedAt = DateTime.UtcNow;
        }
        ImportObjectiveStudyItemsHandler.EnsureValidPositions(rows, await ImportObjectiveStudyItemsHandler.GetObjectiveKind(db, q.ObjectiveId, ct));
        await db.SaveChangesAsync(ct);
        if (transaction is not null) await transaction.CommitAsync(ct);
        return ApiResponse<IReadOnlyList<EducationObjectiveStudyItemAuthorDto>>.Ok(rows.OrderBy(x => x.Position).Select(GetAuthorStudyItemsHandler.ToAuthorDto).ToArray());
    }
}

public sealed record SetObjectiveStudyItemPublicationCommand(string UserId, string CourseId, string ObjectiveId,
    string ItemId, bool Publish, bool NotConfidentialExamContent, bool IsAdmin = false) : IRequest<ApiResponse<EducationObjectiveStudyItemAuthorDto>>;
public sealed class SetObjectiveStudyItemPublicationHandler(IAppDbContext db)
    : IRequestHandler<SetObjectiveStudyItemPublicationCommand, ApiResponse<EducationObjectiveStudyItemAuthorDto>>
{
    public async Task<ApiResponse<EducationObjectiveStudyItemAuthorDto>> Handle(SetObjectiveStudyItemPublicationCommand q, CancellationToken ct)
    {
        var objective = await UpdateObjectiveStudyMetadataHandler.OwnedObjective(db, q.UserId, q.CourseId, q.ObjectiveId, ct, q.IsAdmin);
        var item = await db.EducationObjectiveStudyItems.FirstOrDefaultAsync(x => x.Id == q.ItemId && x.ObjectiveId == q.ObjectiveId && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("Study item not found.");
        var courseIsPublic = await db.EducationCourses.AnyAsync(x => x.Id == q.CourseId && x.IsPublic && !x.IsModerationHidden && !x.IsDeleted, ct);
        if (q.Publish && courseIsPublic && !q.NotConfidentialExamContent)
            throw new ValidationAppException("Explicitly confirm that this item does not contain confidential exam content before publishing it to a public course.");
        if (q.Publish && objective.MemoryContentType == EducationMemoryContentType.OrderedList)
        {
            var items = await db.EducationObjectiveStudyItems.Where(x => x.ObjectiveId == q.ObjectiveId && !x.IsDeleted).ToListAsync(ct);
            ImportObjectiveStudyItemsHandler.EnsureValidPositions(items, objective.MemoryContentType);
        }
        item.SetPublished(q.Publish, q.Publish && courseIsPublic ? q.UserId : null, DateTime.UtcNow);
        await db.SaveChangesAsync(ct);
        return ApiResponse<EducationObjectiveStudyItemAuthorDto>.Ok(GetAuthorStudyItemsHandler.ToAuthorDto(item));
    }
}

public sealed record UpdateObjectiveStudyMetadataRequestPlaceholder;
